-- Fabric notebook source

-- METADATA ********************

-- META {
-- META   "kernel_info": {
-- META     "name": "sqldatawarehouse"
-- META   },
-- META   "dependencies": {
-- META     "warehouse": {
-- META       "default_warehouse": "e0b59438-dd1e-aef5-4826-ec248fd6e79b",
-- META       "known_warehouses": [
-- META         {
-- META           "id": "e0b59438-dd1e-aef5-4826-ec248fd6e79b",
-- META           "type": "Datawarehouse"
-- META         }
-- META       ]
-- META     }
-- META   }
-- META }

-- MARKDOWN ********************

-- <div style="margin: 0; padding: 0; text-align: left;">
--   <table style="border: none; margin: 0; padding: 0; border-collapse: collapse;">
--     <tr>
--       <td style="border: none; vertical-align: middle; text-align: left; padding: 0; margin: 0;">
--         <img src="https://github.com/microsoft/fabric-analytics-roadshow-lab/blob/initial-version-prep/assets/images/spark/analytics.png?raw=true" width="140" />
--       </td>
--       <td style="border: none; vertical-align: middle; padding-left: 0px; text-align: left; padding-right: 0; padding-top: 0; padding-bottom: 0;">
--         <h1 style="font-weight: bold; margin: 0;">Fabric Analytics Roadshow Lab</h1>
--       </td>
--     </tr>
--   </table>
-- </div>
-- 
-- ## Overview
-- Welcome to the **McMillan Industrial Group** analytics transformation journey! In this lab, you'll use the data collected in the lakehouse from the previous lab to build a data model for analytics using Microsoft Fabric's data warehouse.
-- 
-- ### The Business Scenario
-- McMillan Industrial Group is a leading manufacturer and distributor of industrial equipment and parts. Their systems generate a variety of data. The analytical data model will be focused on:
-- - 👥 **Customers** - Customer master data and profiles
-- - 📝 **Orders** - Sales orders placed online and manually
-- - ⚙️ **Items** - Item master data
-- - 📦 **Shipments** - Outbound shipments and delivery tracking
-- 
-- This data has been collected, cleansed, and conformed into actionable data (silver in the medallion architecture) in a lakehouse.
-- 
-- ### Architecture: Medallion Pattern
-- We'll implement a **medallion architecture** - a common practice for organizing data based on the level of data refinement and readiness for end-user consumption:
-- 
-- ```
-- 📥 Landing Zone (Raw Data: JSON/Parquet)
--     ↓ Spark - Structured Streaming
-- 🥉 BRONZE Zone - Raw ingestion with audit columns and column name cleaning
--     ↓ Spark - Structured Streaming
-- 🥈 SILVER Zone - Cleaned, validated, and conformed data
--     ↓ Fabric Warehouse - Dimensional Modeling
-- 🥇 GOLD Zone - Business-level aggregates (Warehouse)
--     ↓
-- 🤖 Analytics & AI - Data Agent and Semantic Models
-- ```
-- 
-- ---
-- 
-- ## 🎯 Lab Setup
-- 
-- Before we explore data warehouse fundamentals, you need to ensure Lab 1 has been completed.
-- 
-- ### What You'll Learn in This Notebook
-- 
-- 1. **Data warehouse fundamentals** - What are dimensions and facts?
-- 2. **Working with schemas and tables** - Create schemas and explore supported DDL
-- 3. **Transforming data with T-SQL** - Use stored procedures to move data from silver to gold
-- 4. **Operationalize warehouse loading** - Orchestrate and schedule data warehouse loading with Data Factory
-- 
-- ### The Target Schema
-- By the end of the lab, you'll understand the basics of dimensional modeling and how to implement them using a Fabric data warehouse:
-- 
-- ![McMillian Industrial Group Gold Schema](https://github.com/microsoft/fabric-analytics-roadshow-lab/blob/initial-version-prep/assets/images/spark/gold-erd.png?raw=true)
-- 
-- Let's get started!


-- MARKDOWN ********************

-- ## 📚 Part 1: Data Warehouse Fundamentals
-- 
-- Before we start creating tables and transforming data, let's explore some core concepts of data warehousing which will set the foundation for what we will build in the rest of this lab.
-- 
-- ### Dimensions
-- - Represent different ways to **slice and dice** business events. Examples include by customer, product, or date.
-- - Each column represents an **attribute** which describe the dimension. For example, the product dimension may contain attributes like size, color, or weight.
-- - Dimensions are often **denormalized** to optimize query performance and ease of use.
-- - To track and analyze changes over time a **slowly changing dimension** can be implemented. The most common are:
--     - **Type 0**: The attribute never changes (Social Security Number, or Birth Date)
--     - **Type 1**: The attribute can change but history is not tracked becuase the changes lack analytical value (Email addresses or Phone Numbers often fall in this category)
--     - **Type 2**: The attribute can change and the history is tracked because it can add analytical value (Change in a customer's home address could be used to analyze purchasing habits over time)
-- 
-- ### Facts
-- - Represent business events that are numeric and measurable. Examples include sales, inventory, or visits.
-- - Columns represent **measures** at a common grain (detail level) which can be aggregated.
-- - Tables are often relatively narrow and very long.
-- - Additional columns contain keys back to dimensions which describe the events.
-- - Fact tables generally fall into the following categories:
--     - Transactional: Each row represents an individual transaction such as an order or a call to a call center.
--     - Snapshot: Track periodic views of the data over time each with a common snapshot date such as product inventory.
--     - Factless Fact (aka Bridge): Do not contain measures, instead just contain a set of intersecting keys. This is commonly used for defining security and can be used to track things like student attendance for a class for a particular date).


-- MARKDOWN ********************

-- ## 🧩 Part 2: Working with Schemas and Tables
-- 
-- In this section we will see how to use schemas for logically grouping tables into dimensions and facts to help users easily understand the data model. We will also create all the tables needed for the dimensional model with the smallest required data types and use capabilities like identity columns for key generation.
-- 
-- **Organizing tables**
-- 
-- Fact and dimension tables will serve as the foundation for the data warehouse's analytical structure. There are many ways to organize these tables. Some organizations will choose to prepen or postpend "Fact" or "Dim" on the table name (DimDate or Date_Dim). Others will choose to use schemas to group all the dimensions and facts (dim.Date and fact.Sale). The method you choose is largely one of preference; just remember to be consistent in the database design. For this lab, we will use schemas.
-- 
-- To get started, let's create two schemas, dim and fact, then verify they have been created successfully. 

-- CELL ********************

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'dim')
EXEC ('CREATE SCHEMA [dim]')

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'fact')
EXEC ('CREATE SCHEMA [fact]')

SELECT * FROM sys.schemas WHERE name IN ('dim', 'fact')

-- METADATA ********************

-- META {
-- META   "language": "sql",
-- META   "language_group": "sqldatawarehouse"
-- META }

-- MARKDOWN ********************

-- With the schemas created, it's time to create the tables. 
-- 
-- **Column names** 
-- 
-- A data warehouse is designed to be used by a wide variety of users across the organization. Users will often be from different departments or divisions. It is important to use business friendly terminology that everyone has agreed upon in the warehouse columns. For example, a source system column like t_t_amt_1 which shows up in the silver layer may not make sense to a business user. Instead translate this to a friendly name like total_amount_with_tax. Again, the use of underscores, camel case, and snake case are one of prefernce, just remember to be consistent. For this lab, we will use underscores. 
-- 
-- **Indexes and statistics** 
-- 
-- Even though data warehouses are generally index-lite databases Fabric data warehouse does not require any indexing! Similarly, no user action is required for statistics; they will be maintained automatically. As a result, the scripts that follow in this lab will not drop, create, or update any indexes or statistics. 
-- 
-- **Identity columns**
-- 
-- Identity columns are widely used for create surrogate keys. A surrogate key is a key generated in the data warehouse for joining tables. These are important because many source systems can have different key composition. One system may use an integer, another a VARCHAR(36), and another a composite key with multiple columns. Using a surrogate key makes joining tables easy and efficient. The surrogate key also aids in tracking changes (SCD Type 2) becuase each version of the record will carry the same business key (also known as an alternate key or AK). In Fabric data warehouse the identity column carries a data type of BIGINT.
-- 
-- **Data types** 
-- 
-- Data type decisions are important as they can have an impact on resource allocation and performance. It is a best practice to always choose the smallest data type necessary. Don't use a BIGINT when an INT will do. Don't use VARCHAR(MAX) when a VARCHAR(50) will hold all the data with a pad for some potential new data. Use integers for key fields when possible. The Fabric warehouse engine does not support the same exact data types found in the SQL Server engine, but they are very close. For example, NVARCHAR is not supported, but becuase of the collation used on VARCHAR fields there shouldn't be issues with storing any characters. DATETIME2 supports up to a precision of 6 rather than 7. 
-- 
-- For an up to date list of data types refer to the [Data Types in Fabric Data Warehouse](https://learn.microsoft.com/en-us/fabric/data-warehouse/data-types) documentation page. 
-- 
-- The script below will create a total of 8 tables:
-- - Dim Address
-- - Dim Customer
-- - Dim Date
-- - Dim Facility
-- - Dim Item
-- - Dim Order Source
-- - Fact Sale
-- - Fact Shipment
-- - etl_tracking (used to track load dates by table to enable incremental loading)


-- CELL ********************

/* Drop the tables if they exist, this is useful in case the script is run multiple times. */
DROP TABLE IF EXISTS [dim].[address]
DROP TABLE IF EXISTS [dim].[customer]
DROP TABLE IF EXISTS [dim].[date]
DROP TABLE IF EXISTS [dim].[facility]
DROP TABLE IF EXISTS [dim].[item]
DROP TABLE IF EXISTS [dim].[order_source]
DROP TABLE IF EXISTS [fact].[order]
DROP TABLE IF EXISTS [fact].[shipment]
DROP TABLE IF EXISTS [dbo].[etl_tracking]
GO

/* Create each table. Notice the identity columns on each dimension have a data type of BIGINT. */
CREATE TABLE [dim].[address]
	(
		[address_sk] 		    [bigint] IDENTITY   NOT NULL,
		[address_line_1] 	    [varchar](50)       NOT NULL,
		[address_line_2] 	    [varchar](50)       NOT NULL,
		[city] 				    [varchar](50)       NOT NULL,
		[state_abbreviation]    [varchar](10)       NOT NULL,
		[zip_code] 			    [varchar](10)       NOT NULL,
		[country] 			    [varchar](10)       NOT NULL,
		[latitude] 			    [float]             NOT NULL,
		[longitude] 		    [float]             NOT NULL
	)

CREATE TABLE [dim].[customer]
	(
		[customer_sk] 					[bigint] IDENTITY   NOT NULL,
		[customer_ak] 					[varchar](50) 	    NOT NULL,
		[customer_name] 				[varchar](50) 	    NOT NULL,
		[customer_description] 			[varchar](100) 	    NOT NULL,
		[primary_contact_first_name] 	[varchar](50) 	    NOT NULL,
		[primary_contact_last_name] 	[varchar](50) 	    NOT NULL,
		[primary_contact_email] 		[varchar](50) 	    NOT NULL,
		[primary_contact_phone] 		[varchar](30) 	    NOT NULL,
		[delivery_city] 				[varchar](50) 	    NOT NULL,
		[delivery_country] 				[varchar](10) 	    NOT NULL,
		[delivery_latitude] 			[float] 		    NOT NULL,
		[delivery_longitude] 			[float] 		    NOT NULL,
		[delivery_state] 				[varchar](10) 	    NOT NULL,
		[delivery_zip_code] 			[varchar](10) 	    NOT NULL,
		[billing_city] 					[varchar](50) 	    NOT NULL,
		[billing_country] 				[varchar](10) 	    NOT NULL,
		[billing_state] 				[varchar](10) 	    NOT NULL,
		[start_date] 					[datetime2](6) 	    NOT NULL,
		[end_date] 						[datetime2](6) 	    NOT NULL
	)

CREATE TABLE [dim].[date]
    (
        [date_sk]       [INT]           NOT NULL,
        [date]          [DATE]          NOT NULL,
        [day_number]    [VARCHAR](7)    NOT NULL,
        [day_of_week]   [VARCHAR](9)    NOT NULL,
        [month_number]  [VARCHAR](7)    NOT NULL,
        [month_name]    [VARCHAR](9)    NOT NULL,
        [quarter]       [SMALLINT]      NOT NULL,
        [year]          [SMALLINT]      NOT NULL
    )

INSERT INTO dbo.dim_date
SELECT
    /*  Date  */
    CONVERT(VARCHAR, [date], 112) AS date_sk,
    [date] AS [date],
    FORMAT([date], 'dd') AS day_number,
    FORMAT([date], 'dddd') AS day_of_week,
    FORMAT([date], 'MM') AS month_number,
    FORMAT([date], 'MMMM') AS month_name,
    DATEPART(QUARTER, [date]) AS [quarter],
    DATEPART(YEAR, [date]) AS [year]
FROM
    (
        SELECT
            DATEADD(DAY, [value], CONVERT(DATE, '2026-01-01')) AS [date]
        FROM GENERATE_SERIES(0, DATEDIFF(DAY, CONVERT(DATE, '2026-01-01'), CONVERT(DATE, '2029-01-01')), 1)
    ) AS dates

CREATE TABLE [dim].[facility]
    (
        [facility_sk] 	        [bigint] IDENTITY   NOT NULL,
        [facility_ak] 	        [varchar](10) 	    NOT NULL,
        [facility_name]         [varchar](50) 	    NOT NULL,
        [facility_type]         [varchar](25) 	    NOT NULL,
        [address] 		        [varchar](50) 	    NOT NULL,
        [city] 			        [varchar](50) 	    NOT NULL,
        [state_abbreviation] 	[varchar](10) 	    NOT NULL,
        [zip_code] 		        [varchar](10) 	    NOT NULL,
        [country] 		        [varchar](10) 	    NOT NULL,
        [latitude] 		        [float] 		    NOT NULL,
        [longitude] 	        [float] 		    NOT NULL,
        [start_date]            [datetime2](6) 	    NOT NULL,
		[end_date] 	            [datetime2](6) 	    NOT NULL
    )

CREATE TABLE [dim].[item]
	(
		[item_sk] 			[bigint] IDENTITY   NOT NULL,
		[item_ak] 			[varchar](50) 	    NOT NULL,
		[sku] 				[varchar](25) 	    NOT NULL,
		[item_description] 	[varchar](500) 	    NOT NULL,
		[brand] 			[varchar](50) 	    NOT NULL,
		[category] 			[varchar](50) 	    NOT NULL,
		[subcategory] 		[varchar](50) 	    NOT NULL,
		[material] 			[varchar](50) 	    NOT NULL,
		[nominal_size] 		[float] 		    NOT NULL,
		[end_connection] 	[varchar](25) 	    NOT NULL,
		[pressure_class] 	[bigint] 		    NOT NULL,
		[weight] 			[float] 		    NOT NULL,
		[cost] 				[float] 		    NOT NULL,
		[list_price] 		[float] 		    NOT NULL,
		[is_sdofcertified] 	[bit] 			    NOT NULL,
		[structural_index] 	[float] 		    NOT NULL,
		[span_rating] 		[float] 		    NOT NULL,
        [start_date] 		[datetime2](6) 	    NOT NULL,
		[end_date] 			[datetime2](6) 	    NOT NULL
	)

CREATE TABLE [dim].[order_source]
	(
		[order_source_sk] 	[bigint] IDENTITY   NOT NULL,
		[order_source_ak] 	[varchar](10) 	    NOT NULL,
		[order_source_name] [varchar](10) 	    NOT NULL,
        [start_date] 		[datetime2](6) 	    NOT NULL,
		[end_date] 			[datetime2](6) 	    NOT NULL
	)

CREATE TABLE [fact].[order]
	(
		[order_sk]              [bigint] IDENTITY   NOT NULL,
        [order_number] 			[varchar](25)	    NOT NULL,
		[order_line_number] 	[smallint] 		    NOT NULL,
		[order_date_sk] 		[int] 			    NOT NULL,
		[order_source_sk] 		[bigint]		    NOT NULL,
		[customer_sk] 			[bigint] 		    NOT NULL,
		[item_sk] 				[bigint] 		    NOT NULL,
		[quantity] 				[bigint] 		    NULL,
		[unit_price] 			[float] 		    NULL,
		[extended_price] 		[float] 		    NULL,
		[net_weight] 			[float] 		    NULL,
		[warranty_included] 	[bit] 			    NULL
	)

CREATE TABLE [fact].[shipment]
	(
		[shipment_sk]                       [bigint] IDENTITY   NOT NULL,
        [tracking_number] 					[varchar](25) 	    NOT NULL,
		[order_number] 						[varchar](25) 	    NOT NULL,
		[ship_date_sk] 						[int] 			    NOT NULL,
		[committed_delivery_date_sk] 		[int] 			    NOT NULL,
		[delivery_date_sk] 					[int] 			    NOT NULL,
		[customer_sk] 						[bigint] 		    NOT NULL,
		[origin_address_sk] 				[bigint] 		    NOT NULL,
		[destination_address_sk] 			[bigint] 		    NOT NULL,
		[service_level] 					[varchar](25) 	    NULL,
		[delivery_days_late] 				[int] 			    NULL,
		[late_delivery_penalty_per_day] 	[float] 		    NULL,
		[late_delivery_penalty] 			[float] 		    NULL,
		[shipment_distance] 				[float] 		    NULL,
		[declared_value] 					[float] 		    NULL,
		[height] 							[float] 		    NULL,
		[width] 							[float] 		    NULL,
		[length] 							[float] 		    NULL,
		[volume] 							[float] 		    NULL,
		[weight] 							[float] 		    NULL,
		[is_fragile] 						[bit] 			    NULL,
		[is_hazardous] 						[bit] 			    NULL,
		[requires_refrigeration] 			[bit] 			    NULL
	)

CREATE TABLE [dbo].[etl_tracking]
    (
        [etl_tracking_id]       [int]           NOT NULL,
        [table_name]            [varchar](20)   NOT NULL,
        [last_load_datetime]    [datetime2](6)  NOT NULL        
    )

INSERT INTO [dbo].[etl_tracking]
VALUES
    (1, 'dim.address',         '1900-01-01 00:00:00'),
    (2, 'dim.customer',        '1900-01-01 00:00:00'),
    (3, 'dim.facility',        '1900-01-01 00:00:00'),
    (4, 'dim.item',            '1900-01-01 00:00:00'),
    (5, 'dim.order_source',    '1900-01-01 00:00:00'),
    (6, 'fact.order',          '1900-01-01 00:00:00'),
    (7, 'fact.shipment',       '1900-01-01 00:00:00')

GO

SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA IN ('dim', 'fact') OR TABLE_NAME = 'etl_tracking'

-- METADATA ********************

-- META {
-- META   "language": "sql",
-- META   "language_group": "sqldatawarehouse"
-- META }

-- MARKDOWN ********************

-- ## 🛠️ Part 3: Transforming Data With T-SQL 
-- 
-- With all the tables created it is time to transform and load the data. We will use stored procedures to encapsulate the transformation logic so it can be called interactively or through a pipeline. 
-- 
-- **Stored procedures** 
-- 
-- A stored procedure is a named, reusable block of SQL code saved inside a database. Instead of sending multiple SQL statements from an application, a stored procedure encapsulates that logic so you call it with a single execution. In a warehouse, this code will clean, transform, and perform INSERT and UPDATE logic. Each procedure accepts a date parameter which will be used as a cutoff date in the query against the silver layer tables. Effectively the logic is written so only records added to the silver layer after the prior ETL run and before the date passed to the parameter are considered. At the end of the procedure the etl_tracking is updated using the date parameter value to reflect the new last_load_date. This prevents the fact tables, which run last, from having new records associated with customers that were create in the gap after the customer dimension was processed but before the fact orders table was processed. 
-- 
-- **MERGE** 
-- 
-- A T‑SQL MERGE statement is a single Data Manipulation Language (DML) command that can INSERT, UPDATE, and DELETE rows in a target table based on comparisons with a source table. Its purpose is to synchronize two datasets in one atomic, set‑based operation. An alternative to MERGE would be separate INSERT and UPDATE statements. 
-- 
-- **Cross database queries** 
-- 
-- Often in a data warehouse scenario you will create a stage schema where you can temporarily land new data before it is processed into the dimensional model. Becuase all the data for this lab is being fed through the medallion layers the data already exists in the silver layer. Since each Fabric lakehouse also has a SQL analytics endpoint we can query the data in place rather than needing to create an extra staging copy along the way. This is accomplished by using a 3-part name in the query in the form of *LakehouseOrWarehouseName.schema.table*.  
-- 
-- Explore the code below to see how various data engineering activities are being accomplished through T-SQL including:
-- 
-- - Renaming columns
-- - Joining and combining tables (denormalization)
-- - Calculating column values in the fact table
-- - Assigning unknown member values
-- - Handling type 1 and type 2 column changes
-- - Looking up surrogate key values in the fact table


-- CELL ********************

/***********     dim.address     ***********/
DROP PROCEDURE IF EXISTS dbo.load_dim_address
GO

CREATE PROCEDURE dbo.load_dim_address (@new_load_datetime DATETIME2(6) = NULL)
AS
BEGIN
    /* Get last update datetime from etl_tracking table and set new load time variable */
    SELECT @new_load_datetime = ISNULL(@new_load_datetime, GETDATE())
    DECLARE @last_load_datetime DATETIME2(6) = (SELECT last_load_datetime FROM dbo.etl_tracking WHERE table_name = 'dim.address')
    
    /* Handle the unknown member */
    IF NOT EXISTS (SELECT * FROM dim.address WHERE address_line_1 = 'Unknown' AND address_line_2 = 'Unknown' AND state_abbreviation = 'Unknown' AND zip_code = 'Unknown' AND country = 'Unknown')
    INSERT INTO dim.address VALUES ('Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 0.0, 0.0)

    /* UPSERT the data from the lakehouse bronze tables */
    MERGE dim.address AS t
    USING 
        (
            SELECT
                destination_address AS address_line_1, 
                '' AS address_line_2,
                destination_city AS city,
                destination_state AS state_abbreviation,
                destination_zip_code AS zip_code,
                destination_country AS country,
                destination_latitude AS latitude,
                destination_longitude AS longitude
            FROM SalesAndLogisticsLH.silver.shipment
            WHERE
                _processing_timestamp > @last_load_datetime
                AND _processing_timestamp <= @new_load_datetime

            UNION

            SELECT
                origin_address AS address_line_1, 
                '' AS address_line_2,
                origin_city AS city,
                origin_state AS state_abbreviation,
                origin_zip_code AS zip_code,
                origin_country AS country,
                origin_latitude AS latitude,
                origin_longitude AS longitude
            FROM SalesAndLogisticsLH.silver.shipment
            WHERE
                _processing_timestamp > @last_load_datetime
                AND _processing_timestamp <= @new_load_datetime
        ) AS s
        ON t.address_line_1 = s.address_line_1
        AND t.city = s.city
        AND t.state_abbreviation = s.state_abbreviation
        AND t.zip_code = s.zip_code
    WHEN MATCHED THEN
        UPDATE
        SET
            address_line_1 = s.address_line_1,
            address_line_2 = s.address_line_2,
            city = s.city,
            state_abbreviation = s.state_abbreviation,
            zip_code = s.zip_code,
            country = s.country,
            latitude = s.latitude,
            longitude = s.longitude
    WHEN NOT MATCHED THEN 
        INSERT (address_line_1, address_line_2, city, state_abbreviation, zip_code, country, latitude, longitude)
        VALUES(s.address_line_1, s.address_line_2, s.city, s.state_abbreviation, s.zip_code, s.country, s.latitude, s.longitude);

    /* Update the etl_tracking table */
    UPDATE dbo.etl_tracking
    SET last_load_datetime = @new_load_datetime
    WHERE table_name = 'dim.address'
END
GO

/***********     dim.customer     ***********/
DROP PROCEDURE IF EXISTS dbo.load_dim_customer
GO

CREATE PROCEDURE dbo.load_dim_customer (@new_load_datetime DATETIME2(6) = NULL)
AS
BEGIN
    /* Get last update datetime from etl_tracking table and set new load time variable */
    SELECT @new_load_datetime = ISNULL(@new_load_datetime, GETDATE())
    DECLARE @last_load_datetime DATETIME2(6) = (SELECT last_load_datetime FROM dbo.etl_tracking WHERE table_name = 'dim.customer')

    /* Handle the unknown member */
    IF NOT EXISTS (SELECT * FROM dim.customer WHERE customer_ak = 'Unknown')
    INSERT INTO dim.customer VALUES ('Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 0, 0, 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', '1900-01-01', '12-31-2099')

    /* UPSERT the data from the lakehouse bronze tables */
    MERGE dim.customer AS t
    USING 
        (
            SELECT
                [customer_id] AS customer_ak,
                [customer_name],
                [description] AS customer_description,
                [primary_contact_first_name],
                [primary_contact_last_name],
                [primary_contact_email],
                [primary_contact_phone],
                [delivery_city],
                [delivery_country],
                [delivery_latitude],
                [delivery_longitude],
                [delivery_state],
                [delivery_zip_code],
                [billing_city],
                [billing_country],
                [billing_state],
                '1900-01-31' AS start_date,
                '2099-12-31' AS end_date
            FROM SalesAndLogisticsLH.silver.customer
            WHERE
                _processing_timestamp > @last_load_datetime
                AND _processing_timestamp <= @new_load_datetime
        ) AS s
        ON t.customer_ak = s.customer_ak
    WHEN MATCHED THEN
        UPDATE
        SET
            customer_ak                 = s.customer_ak,
            customer_name               = s.customer_name,
            customer_description        = s.customer_description,
            primary_contact_first_name  = s.primary_contact_first_name,
            primary_contact_last_name   = s.primary_contact_last_name,
            primary_contact_email       = s.primary_contact_email,
            primary_contact_phone       = s.primary_contact_phone,
            delivery_city               = s.delivery_city,
            delivery_country            = s.delivery_country,
            delivery_latitude           = s.delivery_latitude,
            delivery_longitude          = s.delivery_longitude,
            delivery_state              = s.delivery_state,
            delivery_zip_code           = s.delivery_zip_code,
            billing_city                = s.billing_city,
            billing_country             = s.billing_country,
            billing_state               = s.billing_state,
            start_date                  = s.start_date,
            end_date                    = s.end_date
    WHEN NOT MATCHED THEN 
        INSERT (customer_ak, customer_name, customer_description, primary_contact_first_name, primary_contact_last_name, primary_contact_email, primary_contact_phone, delivery_city, delivery_country, delivery_latitude, delivery_longitude, delivery_state, delivery_zip_code, billing_city, billing_country, billing_state, start_date, end_date)
        VALUES (s.customer_ak, s.customer_name, s.customer_description, s.primary_contact_first_name, s.primary_contact_last_name, s.primary_contact_email, s.primary_contact_phone, s.delivery_city, s.delivery_country, s.delivery_latitude, s.delivery_longitude, s.delivery_state, s.delivery_zip_code, s.billing_city, s.billing_country, s.billing_state, s.start_date, s.end_date);

    /* Update the etl_tracking table */
    UPDATE dbo.etl_tracking
    SET last_load_datetime = @new_load_datetime
    WHERE table_name = 'dim.customer'
END
GO

/***********     dim.facility     ***********/
DROP PROCEDURE IF EXISTS dbo.load_dim_facility
GO

CREATE PROCEDURE dbo.load_dim_facility (@new_load_datetime DATETIME2(6) = NULL)
AS
BEGIN
     /* Get last update datetime from etl_tracking table and set new load time variable */
    SELECT @new_load_datetime = ISNULL(@new_load_datetime, GETDATE())
    DECLARE @last_load_datetime DATETIME2(6) = (SELECT last_load_datetime FROM dbo.etl_tracking WHERE table_name = 'dim.facility')
    
    /* Handle the unknown member */
    IF NOT EXISTS (SELECT * FROM dim.facility WHERE facility_ak = 'Unknown')
    INSERT INTO dim.facility VALUES ('Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 0.0, 0.0, '1900-01-01', '12-31-2099')

    /* UPSERT the data from the lakehouse bronze tables */
    MERGE dim.facility AS t
    USING 
        (
            SELECT
                facility_id AS facility_ak,
                facility_name,
                facility_type,
                address,
                city,
                [state] AS state_abbreviation,
                zip_code,
                country,
                latitude,
                longitude,
                '1900-01-01' AS start_date,
                '12-31-2099' AS end_date
            FROM SalesAndLogisticsLH.silver.facility
            WHERE 
                _processing_timestamp > @last_load_datetime
                AND _processing_timestamp <= @new_load_datetime
        ) AS s
        ON t.facility_ak = s.facility_ak
    WHEN MATCHED THEN
        UPDATE
        SET
            facility_ak         = s.facility_ak,
            facility_name       = s.facility_name,
            facility_type       = s.facility_type,
            address             = s.address,
            city                = s.city,
            state_abbreviation  = s.state_abbreviation,
            zip_code            = s.zip_code
    WHEN NOT MATCHED THEN 
        INSERT (facility_ak, facility_name, facility_type, address, city, state_abbreviation, zip_code, country, latitude, longitude, start_date, end_date)
        VALUES(s.facility_ak, s.facility_name, s.facility_type, s.address, s.city, s.state_abbreviation, s.zip_code, s.country, s.latitude, s.longitude, s.start_date, s.end_date);

    /* Update the etl_tracking table */
    UPDATE dbo.etl_tracking
    SET last_load_datetime = @new_load_datetime
    WHERE table_name = 'dim.facility'
END
GO

/***********     dim.item     ***********/
DROP PROCEDURE IF EXISTS dbo.load_dim_item
GO

CREATE PROCEDURE dbo.load_dim_item (@new_load_datetime DATETIME2(6) = NULL)
AS
BEGIN
    /* Get last update datetime from etl_tracking table and set new load time variable */
    SELECT @new_load_datetime = ISNULL(@new_load_datetime, GETDATE())
    DECLARE @last_load_datetime DATETIME2(6) = (SELECT last_load_datetime FROM dbo.etl_tracking WHERE table_name = 'dim.item')
    
    /* Handle the unknown member */
    IF NOT EXISTS (SELECT * FROM dim.item WHERE item_ak = 'Unknown')
    INSERT INTO dim.item VALUES ('Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 0, 'Unknown', 0, 0, 0, 0, 0, 0, 0, '1900-01-01', '12-31-2099')

    /* UPSERT the data from the lakehouse bronze tables */
    MERGE dim.item AS t
    USING 
        (
            SELECT
                item_id AS item_ak,
                sku,
                description AS item_description,
                brand,
                category,
                subcategory,
                material,
                nominal_size,
                end_connection,
                pressure_class,
                weight,
                cost,
                list_price,
                is_sdofcertified,
                structural_index,
                span_rating,
                '1900-01-01' AS start_date,
                '12-31-2099' AS end_date
            FROM SalesAndLogisticsLH.silver.item
            WHERE
                _processing_timestamp > @last_load_datetime
                AND _processing_timestamp <= @new_load_datetime
        ) AS s
        ON t.item_ak = s.item_ak
    WHEN MATCHED THEN
        UPDATE
        SET
            item_ak             = s.item_ak,
            sku                 = s.sku,
            item_description    = s.item_description,
            brand               = s.brand,
            category            = s.category,
            subcategory         = s.subcategory,
            material            = s.material
    WHEN NOT MATCHED THEN 
        INSERT (item_ak, sku, item_description, brand, category, subcategory, material, nominal_size, end_connection, pressure_class, weight, cost, list_price, is_sdofcertified, structural_index, span_rating, start_date, end_date)
        VALUES(s.item_ak, s.sku, s.item_description, s.brand, s.category, s.subcategory, s.material, s.nominal_size, s.end_connection, s.pressure_class, s.weight, s.cost, s.list_price, s.is_sdofcertified, s.structural_index, s.span_rating, s.start_date, s.end_date);

    /* Update the etl_tracking table */
    UPDATE dbo.etl_tracking
    SET last_load_datetime = @new_load_datetime
    WHERE table_name = 'dim.item'
END
GO

/***********     dim.order_source     ***********/
DROP PROCEDURE IF EXISTS dbo.load_dim_order_source
GO

CREATE PROCEDURE dbo.load_dim_order_source (@new_load_datetime DATETIME2(6) = NULL)
AS
BEGIN
    /* Get last update datetime from etl_tracking table and set new load time variable */
    SELECT @new_load_datetime = ISNULL(@new_load_datetime, GETDATE())
    DECLARE @last_load_datetime DATETIME2(6) = (SELECT last_load_datetime FROM dbo.etl_tracking WHERE table_name = 'dim.order_source')
    
    /* Handle the unknown member */
    IF NOT EXISTS (SELECT * FROM dim.order_source WHERE order_source_ak = 'Unknown')
    INSERT INTO dim.order_source VALUES ('Unknown', 'Unknown', '1900-01-01', '12-31-2099')

    /* UPSERT the data from the lakehouse bronze tables */
    INSERT INTO dim.order_source
    SELECT DISTINCT
        source AS order_source_ak,
        source AS order_source_name,
        '1900-01-01' AS start_date,
        '12-31-2099' AS end_date
    FROM SalesAndLogisticsLH.silver.[order] AS o
    LEFT JOIN dim.order_source AS os
        ON o.source = os.order_source_ak
    WHERE
        os.order_source_ak IS NULL
        AND _processing_timestamp > @last_load_datetime
        AND _processing_timestamp <= @new_load_datetime

    /* Update the etl_tracking table */
    UPDATE dbo.etl_tracking
    SET last_load_datetime = @new_load_datetime
    WHERE table_name = 'dim.order_source'
END
GO

/***********     fact.order     ***********/
DROP PROCEDURE IF EXISTS dbo.load_fact_order
GO

CREATE PROCEDURE dbo.load_fact_order (@new_load_datetime DATETIME2(6) = NULL)
AS
BEGIN
    /* Get last update datetime from etl_tracking table and set new load time variable */
    SELECT @new_load_datetime = ISNULL(@new_load_datetime, GETDATE())
    DECLARE @last_load_datetime DATETIME2(6) = (SELECT last_load_datetime FROM dbo.etl_tracking WHERE table_name = 'fact.order')
    
    /* Insert new records from the lakehouse bronze tables */
    INSERT INTO fact.[order]
    SELECT
        o.order_number,
        o.line_number AS order_line_number,
        ISNULL(d.date_sk, 19000101) AS order_date_sk,
        ISNULL(os.order_source_sk, -1) AS order_source_sk,
        ISNULL(c.customer_sk, -1) AS customer_sk,
        ISNULL(i.item_sk, -1) AS item_sk,
        o.quantity,
        o.unit_price,
        o.extended_price,
        o.net_weight,
        o.warranty_included
    FROM SalesAndLogisticsLH.silver.[order] AS o
    LEFT JOIN dim.order_source AS os
        ON o.source = os.order_source_ak
    LEFT JOIN dim.customer AS c
        ON o.customer_id = c.customer_ak
    LEFT JOIN dim.item AS i
        ON o.item_id = i.item_ak
    LEFT JOIN dim.[date] AS d
        ON CONVERT(DATE, o.order_date) = d.[date]
    WHERE
        NOT EXISTS
            (
                SELECT
                    1
                FROM fact.[order] AS fo
                WHERE
                    o.order_number = fo.order_number
                    AND o.line_number = fo.order_line_number
            )
        AND _processing_timestamp > @last_load_datetime
        AND _processing_timestamp <= @new_load_datetime
    /* Update the etl_tracking table */
    UPDATE dbo.etl_tracking
    SET last_load_datetime = @new_load_datetime
    WHERE table_name = 'fact.order'
END
GO

/***********     fact.shipment     ***********/
DROP PROCEDURE IF EXISTS dbo.load_fact_shipment
GO

CREATE PROCEDURE dbo.load_fact_shipment (@new_load_datetime DATETIME2(6) = NULL)
AS
BEGIN
    /* Get last update datetime from etl_tracking table and set new load time variable */
    SELECT @new_load_datetime = ISNULL(@new_load_datetime, GETDATE())
    DECLARE @last_load_datetime DATETIME2(6) = (SELECT last_load_datetime FROM dbo.etl_tracking WHERE table_name = 'fact.shipment')
    
    /* Insert new records from the lakehouse bronze tables */
    INSERT INTO fact.shipment
    SELECT DISTINCT
        s.tracking_number
        ,o.order_number
        ,ISNULL(sd.date_sk, 19000101) AS ship_date_sk
        ,ISNULL(cdd.date_sk, 19000101) AS committed_delivery_date_sk
        ,ISNULL(dd.date_sk, 19000101) AS delivery_date_sk
        ,ISNULL(c.[customer_sk], -1) AS customer_sk
        ,ISNULL(oa.address_sk, -1) AS origin_address_sk
        ,ISNULL(da.address_sk, -1) AS destination_address_sk
        ,s.service_level
        ,GREATEST(DATEDIFF(DAY, CONVERT(DATE, s.committed_delivery_date), CONVERT(DATE, delivery.delivery_date)), 0) AS delivery_days_late
        ,s.[late_delivery_penalty_per_day]
        ,GREATEST(DATEDIFF(DAY, CONVERT(DATE, s.committed_delivery_date), CONVERT(DATE, delivery.delivery_date)), 0) * s.late_delivery_penalty_per_day AS late_delivery_penalty
        ,s.distance AS shipment_distance
        ,s.declared_value
        ,s.height
        ,s.width
        ,s.length
        ,s.volume
        ,s.weight
        ,s.is_fragile
        ,s.is_hazardous
        ,s.requires_refrigeration
    FROM SalesAndLogisticsLH.silver.shipment AS s
    LEFT JOIN SalesAndLogisticsLH.silver.[order] AS o
        ON s.order_id = o.order_id
    LEFT JOIN dim.customer AS c
        ON s.customer_id = c.customer_ak
    LEFT JOIN dim.address AS da
        ON s.destination_address = da.address_line_1
        AND s.destination_city = da.city
        AND s.destination_state = da.state_abbreviation
        AND s.destination_zip_code = da.zip_code
    LEFT JOIN dim.address AS oa
        ON  s.origin_address = oa.address_line_1
        AND s.origin_city = oa.city
        AND s.origin_state = oa.state_abbreviation
        AND s.origin_zip_code = oa.zip_code
    LEFT JOIN dim.date AS sd
        ON CONVERT(DATE, s.ship_date) = sd.date
    LEFT JOIN dim.date AS cdd
        ON CONVERT(DATE, s.committed_delivery_date) = cdd.date
    LEFT JOIN (
        SELECT 
            shipment_id,
            CONVERT(DATE, event_timestamp) AS delivery_date
        FROM SalesAndLogisticsLH.silver.shipment_scan_event
        WHERE event_type = 'Delivered'
    ) AS delivery
        ON s.shipment_id = delivery.shipment_id
    LEFT JOIN dim.date AS dd
        ON delivery.delivery_date = dd.date
    WHERE
        NOT EXISTS
            (
                SELECT
                    1
                FROM fact.shipment AS fs
                WHERE
                    s.tracking_number = fs.tracking_number
            )
        AND s._processing_timestamp > @last_load_datetime
        AND s._processing_timestamp <= @new_load_datetime

    /* Update the etl_tracking table */
    UPDATE dbo.etl_tracking
    SET last_load_datetime = @new_load_datetime
    WHERE table_name = 'fact.shipment'
END
GO

-- METADATA ********************

-- META {
-- META   "language": "sql",
-- META   "language_group": "sqldatawarehouse"
-- META }

-- MARKDOWN ********************

-- Now that the stored procedures are created, run the next cell to execute the stored procedures. The script will collect a pre-load record count on the tables, run the load procedures, then collect a post-load record count. Notice the record counts on the tables before and after the procedure runs on the output. 
-- 
-- Optionally, wait a few minutes and run the cell again to see more data flowing in from the silver lakehouse.

-- CELL ********************

DECLARE @dim_address        BIGINT 
DECLARE @dim_customer       BIGINT 
DECLARE @dim_facility       BIGINT
DECLARE @dim_item           BIGINT
DECLARE @dim_order_source   BIGINT
DECLARE @fact_order         BIGINT
DECLARE @fact_shipment      BIGINT

/* Get the record count before running the procedures */
SELECT
    @dim_address        = (SELECT COUNT_BIG(*) FROM dim.address),
    @dim_customer       = (SELECT COUNT_BIG(*) FROM dim.customer),
    @dim_facility       = (SELECT COUNT_BIG(*) FROM dim.facility),
    @dim_item           = (SELECT COUNT_BIG(*) FROM dim.item),
    @dim_order_source   = (SELECT COUNT_BIG(*) FROM dim.order_source),
    @fact_order         = (SELECT COUNT_BIG(*) FROM fact.[order]),
    @fact_shipment      = (SELECT COUNT_BIG(*) FROM fact.shipment)

/* Run the stored procedures, passing in the same load time for each procedure */
DECLARE @data_warehouse_load_time DATETIME2(6) = GETDATE()

EXEC load_dim_address       @data_warehouse_load_time
EXEC load_dim_customer      @data_warehouse_load_time
EXEC load_dim_facility      @data_warehouse_load_time
EXEC load_dim_item          @data_warehouse_load_time
EXEC load_dim_order_source  @data_warehouse_load_time
EXEC load_fact_order        @data_warehouse_load_time
EXEC load_fact_shipment     @data_warehouse_load_time

/* Get the record count after running the procedures and compare them to the before numbers */
SELECT @dim_address        AS record_count_before, COUNT_BIG(*) AS record_count_after, COUNT_BIG(*) - @dim_address        AS record_count_change, 'dim.address'       AS table_name FROM dim.address        UNION ALL
SELECT @dim_customer       AS record_count_before, COUNT_BIG(*) AS record_count_after, COUNT_BIG(*) - @dim_customer       AS record_count_change, 'dim.customer'      AS table_name FROM dim.customer       UNION ALL
SELECT @dim_facility       AS record_count_before, COUNT_BIG(*) AS record_count_after, COUNT_BIG(*) - @dim_facility       AS record_count_change, 'dim.facility'      AS table_name FROM dim.facility       UNION ALL
SELECT @dim_item           AS record_count_before, COUNT_BIG(*) AS record_count_after, COUNT_BIG(*) - @dim_item           AS record_count_change, 'dim.item'          AS table_name FROM dim.item           UNION ALL
SELECT @dim_order_source   AS record_count_before, COUNT_BIG(*) AS record_count_after, COUNT_BIG(*) - @dim_order_source   AS record_count_change, 'dim.order_source'  AS table_name FROM dim.order_source   UNION ALL
SELECT @fact_order         AS record_count_before, COUNT_BIG(*) AS record_count_after, COUNT_BIG(*) - @fact_order         AS record_count_change, 'fact.order'        AS table_name FROM fact.[order]       UNION ALL
SELECT @fact_shipment      AS record_count_before, COUNT_BIG(*) AS record_count_after, COUNT_BIG(*) - @fact_shipment      AS record_count_change, 'fact.shipment'     AS table_name FROM fact.shipment

-- METADATA ********************

-- META {
-- META   "language": "sql",
-- META   "language_group": "sqldatawarehouse"
-- META }

-- MARKDOWN ********************

-- ## 🏭 Part 4: Operationalize Warehouse Loading
