# Fabric notebook source

# METADATA ********************

# META {
# META   "kernel_info": {
# META     "name": "synapse_pyspark"
# META   },
# META   "dependencies": {
# META     "lakehouse": {
# META       "default_lakehouse": "a7c7038f-32a5-45b6-a126-4d3c0ebdf019",
# META       "default_lakehouse_name": "SalesAndLogisticsLH",
# META       "default_lakehouse_workspace_id": "60c4c0e4-1e55-44cc-b6c3-860d3bb431ba",
# META       "known_lakehouses": [
# META         {
# META           "id": "a7c7038f-32a5-45b6-a126-4d3c0ebdf019"
# META         }
# META       ]
# META     }
# META   }
# META }

# MARKDOWN ********************

# <div style="margin: 0; padding: 0; text-align: left;">
#   <table style="border: none; margin: 0; padding: 0; border-collapse: collapse;">
#     <tr>
#       <td style="border: none; vertical-align: middle; text-align: left; padding: 0; margin: 0;">
#         <img src="https://github.com/microsoft/fabric-analytics-roadshow-lab/blob/initial-version-prep/assets/images/spark/analytics.png?raw=true" width="140" />
#       </td>
#       <td style="border: none; vertical-align: middle; padding-left: 0px; text-align: left; padding-right: 0; padding-top: 0; padding-bottom: 0;">
#         <h1 style="font-weight: bold; margin: 0;">Fabric Analytics Roadshow Lab</h1>
#       </td>
#     </tr>
#   </table>
# </div>
# 
# ## Overview
# Welcome to the **McMillan Industrial Group** analytics transformation journey! In this lab, you'll build a modern, streaming-enabled data lakehouse using Microsoft Fabric.
# 
# ### The Business Scenario
# McMillan Industrial Group is a leading manufacturer and distributor of industrial equipment and parts. Their systems generate real-time data from:
# - 👥 **Customers** - Customer master data and profiles
# - 📝 **Orders** - Sales orders placed online and manually
# - ⚙️ **Items** - Item master data
# - 📦 **Shipments** - Outbound shipments and delivery tracking
# - 📱 **Shipment Scan Events** - Real-time package scanning from field technicians and warehouse systems
# - 🚚 **Logistics Dimensions** - Facilities, routes, shipping methods, service level, and exception type
# 
# This data streams continuously into OneLake in various formats (JSON, Parquet), and your mission is to transform raw data into actionable business intelligence.
# 
# ### Architecture: Medallion Pattern
# We'll implement a **medallion architecture** - a common practice for organizing data based on the level of data refinement and readiness for end-user consumption:
# 
# > ℹ️ _Note: similar streaming scenarios ideally leverage Azure Event Hubs or Fabric EventStreams to store events in a message store that manages sequence and provides a simple consumption endpoint. The same JSON payloads could be coming from either of these message stores, however for simplicity of reproducing the use case, we will be reading events as files stored in OneLake._
# 
# ```
# 📥 Landing Zone (Raw Data: JSON/Parquet)
#     ↓ Spark - Structured Streaming
# 🥉 BRONZE Zone - Raw ingestion with audit columns and column name cleaning
#     ↓ Spark - Structured Streaming
# 🥈 SILVER Zone - Cleaned, validated, and conformed data
#     ↓ Fabric Warehouse - Dimensional Modeling
# 🥇 GOLD Zone - Business-level aggregates (Warehouse)
#     ↓
# 🤖 Analytics & AI - Data Agent and Semantic Models
# ```
# 
# ---
# 
# ## 🎯 Lab Setup: Start Your Data Pipeline!
# 
# Before we explore Spark fundamentals, you need to **start the production-grade streaming pipeline** that will process data throughout this lab.
# 
# ### Step 1: Trigger the Spark Job Definition
# > **Note:** Please read the full instructions for this step before opening the Spark Job Definition.
# 
# 1. **Open Spark Job Definition** - Click here to open: [StreamBonzeAndSilver](https://app.powerbi.com/groups/$workspaceId/sparkjobdefinitions/$sparkJobDefinitionId?experience=power-bi)
# 1. **Click** the **"Run"** button at the top of the screen
# 1. **Confirm** the job starts successfully (you'll see a status of "Running")
# 1. **Return** to this Notebook (1_ExploreData)
# 
# ### What Happens Next
# 
# The Spark Job Definition you just triggered will:
# - 🎲 **Generate synthetic data** simulating McMillan's business operations
# - 📝 **Write JSON and Parquet files** to the Landing zone (folder) of your Lakehouse
# - ⚡ **Stream data** from Landing → Bronze → Silver zones
# - 🔄 **Run continuously** for the duration of this lab
# 
# > ℹ️ **Important:** The job runs in the background. You don't need to wait for it to complete - you can start working through this notebook immediately. The job should take approximately 1.5 minutes to start writing data to `Files/landing/` and another 2-3 minutes for all bronze and silver tables to be initially created and hydrated with data.
# 
# ### What You'll Learn in This Notebook
# 
# 1. **Spark Fundamentals** - DataFrames, transformations, and actions
# 2. **Structured Streaming** - Processing real-time and batch data with Spark
# 3. **Data Exploration** - Discover what's already been processed in Bronze & Silver zones
# 
# ### The Target Schema
# By the end of the lab, you'll understand some basic concepts and then see the outcome of a mature data engineering pipeline:
# 
# ![McMillian Industrial Group Silver Schema](https://github.com/microsoft/fabric-analytics-roadshow-lab/blob/initial-version-prep/assets/images/spark/silver-erd.png?raw=true)
# 
# Let's get started!


# MARKDOWN ********************

# ## 📚 Part 1: Spark Fundamentals
# 
# Before diving into streaming data, let's understand the power of Apache Spark. Spark is a distributed computing engine that allows you to process massive datasets across one or many machines.
# 
# ### Key Concepts
# - **DataFrame**: A distributed collection of data organized into named columns (like a table)
# - **Lazy Evaluation**: Transformations aren't executed until an action is called
# - **Partitioning**: Data is split across multiple nodes for parallel processing
# - **In-Memory Processing**: Spark caches data in RAM for lightning-fast analysis
# 
# Fabric Spark Notebooks have a Spark session already started, so let's get right into exploring some data.
# 
# Execute the cell below to preview parquet data landing in the `Files/landing/item` folder. 

# CELL ********************

# Read parquet file via Spark
df = spark.read.parquet('Files/landing/item')
display(df)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# Run the cell below to preview JSON data from the `Files/landing/shipment` folder. Notice how there's a `data` `Struct` column. This contains the entire shipment structure with various nested elements. This data will be flattened when writing to the Silver zone.
# 
# > ℹ️ **Tip:** Complex data type columns (Struct, Map, Array, etc.) can be drilled into by clicking on a cell value and then clicking the caret symbol. 
# 
# ![Explore Struct](https://github.com/microsoft/fabric-analytics-roadshow-lab/blob/initial-version-prep/assets/images/spark/explore-struct.gif?raw=true)

# CELL ********************

# Read parquet file via Spark
df = spark.read.json('Files/landing/shipment', multiLine=True)
display(df)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Switching Between DataFrame API and Spark SQL
# 
# While the PySpark **DataFrame API** was just used to preview files, we can also use **Spark SQL** to query the same data using familiar SQL syntax. Both approaches are equally powerful and often interchangeable.
# 
# #### 📋 What We'll Demonstrate
# 
# The next cells show two key SQL patterns:
# 
# **1. Creating a Temporary View**
# - Register JSON files as a SQL table (exists only for this session)
# - Query file-based data as if it were a database table
# - Express additional options like `multiLine` JSON configuration
# 
# **2. Exploding Nested Arrays** _(you'll write this query!)_
# - The shipment JSON contains an **array** of shipment records
# - Use `EXPLODE()` to transform arrays into individual rows
# - Use `*` to expand all columns from nested structs into flat columns
# 
# > 🎯 **Why This Matters:** While many data engineers prefer the PySpark DataFrame API, Spark supports SQL too (SparkSQL). It's often easier to express complex business logic in SQL - there's no need to compromise, work in the language that you are most comfortable with! 
# 
# > 💡 **Pro Tip**: Use `%%sql` magic command or `spark.sql()` to write pure SparkSQL instead of PySpark code!
# 
# First, let's create the temporary view:


# CELL ********************

# MAGIC %%sql
# MAGIC CREATE OR REPLACE TEMPORARY VIEW shipment_data
# MAGIC USING JSON
# MAGIC OPTIONS (
# MAGIC   path "Files/landing/shipment",
# MAGIC   multiLine "true"
# MAGIC );

# METADATA ********************

# META {
# META   "language": "sparksql",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### 🎯 Challenge: Query Nested JSON Data
# 
# Now it's your turn! Write a `SELECT` statement to query the `shipment_data` temporary view and flatten the nested structure.
# 
# **💡 Hints:**
# - Use `explode(<column_name>)` to expand an array into individual rows
# - Use `<column_name>.*` to select all top-level elements from a struct or map
# - You'll need a subquery to explode first, then expand the struct
# 
# Try it in the cell below!

# CELL ********************

# MAGIC %%sql


# METADATA ********************

# META {
# META   "language": "sparksql",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ---
# 
# <details>
#   <summary><strong>🔑 Solution:</strong> Click to reveal the answer</summary>
# 
# <br/>
# 
# **Approach:**
# 1. Inner query: `EXPLODE(data)` converts the array into rows with alias `shipment`
# 2. Outer query: `shipment.*` expands all struct fields into columns
# 
# ```sql
# SELECT shipment.*
# FROM (
#     SELECT explode(data) as shipment 
#     FROM shipment_data
# );
# ```
# 
# **Key Takeaway:** This two-step pattern (explode → expand) is fundamental for flattening nested JSON in data engineering pipelines.
#   
# </details>

# MARKDOWN ********************

# ---
# ## 🌊 Part 2: Why Structured Streaming?
# 
# **Structured Streaming** is Spark's powerful engine for processing data streams, but it's useful far beyond just real-time, low-latency scenarios. Here's why it's commonly used in modern data engineering:
# 
# ### 🎯 Key Benefits
# 
# 1. **Built-in Incremental Processing**
#    - Automatically tracks which data has been processed
#    - Only processes new/changed files since the last run
#    - No need to manually manage watermarks or state
# 
# 1. **Exactly-Once Semantics**
#    - Guarantees each record is processed exactly once
#    - Prevents duplicate data in your Delta tables
#    - Handles failures gracefully with automatic recovery
# 
# 1. **Fault Tolerance**
#    - Checkpointing saves progress automatically
#    - If a job fails, it resumes from the last checkpoint
#    - No data loss or reprocessing of already-handled records
# 
# 1. **Unified API**
#    - Same DataFrame API for batch and streaming
#    - Write once, run in batch or streaming mode
#    - Easy to prototype in batch, deploy as streaming
# 
# 1. **Optimized for Delta Lake**
#    - Native integration with Delta tables
#    - Handles schema evolution automatically
#    - Enables time travel and data versioning
# 
# ### 💼 Common Use Cases
# 
# - **ETL Pipelines**: Continuously ingest and transform data as it arrives
# - **Data Lakehouse**: Build incremental Bronze → Silver → Gold pipelines
# - **Real-time Analytics**: Power dashboards with up-to-the-minute data
# - **Change Data Capture (CDC)**: Process CDC data from source systems
# - **Event Processing**: Handle IoT sensors, clickstreams, logs, etc.
# 
# ### 🏗️ Architecture in This Lab
# 
# In our medallion architecture, Structured Streaming powers:
# - **Landing → Bronze**: Ingesting raw JSON/Parquet files with audit metadata and column renaming (snake case)
# - **Bronze → Silver**: Flattening nested structures, applying business rules, data quality checks
# 
# Even though the data arrives as files in OneLake (not a traditional message store), Structured Streaming gives us:
# - Incremental processing (only new files)
# - Exactly-once guarantees (no duplicates)
# - Automatic restart capability (fault tolerance)
# - Scalability (handles growing data volumes)


# MARKDOWN ********************

# ---
# 
# ## 🌊 Part 3: Structured Streaming Fundamentals
# 
# Structured Streaming is Spark's **scalable and fault-tolerant** stream processing engine. It treats streaming data as an **unbounded table** that grows continuously.
# 
# ### 🧩 Key Streaming Concepts
# 
# | Component | Description |
# |-----------|-------------|
# | **Input Source** | Where data comes from (files, Kafka, Event Hubs, etc.) |
# | **Transformations** | How you process each micro-batch (same API as batch!) |
# | **Output Sink** | Where results are written (Delta tables, console, memory, etc.) |
# | **Checkpointing** | Tracks progress for exactly-once processing and fault tolerance |
# | **Trigger Intervals** | How often to process new data (continuous, fixed interval, available now) |
# 
# ### 🔧 The Streaming Pattern
# 
# ```python
# # 1. Read stream from source
# df = spark.readStream.format("json").load("path/to/input")
# 
# # 2. Apply transformations (same as batch!)
# transformed = df.select(...).where(...).withColumn(...)
# 
# # 3. Write to Delta Lake
# query = transformed.writeStream \
#     .format("delta") \
#     .outputMode("append") \
#     .option("checkpointLocation", "path/to/checkpoint") \
#     .start("path/to/delta/table")
# ```
# 
# ### 💡 Batch vs Streaming: Same Code!
# 
# The beauty of Structured Streaming is that **the same transformation code** works for both batch and streaming. The only difference is:
# - Batch: `spark.read...` → `df.write...`
# - Streaming: `spark.readStream...` → `df.writeStream...`
# 
# Let's see this in action! First, let's query the `item` parquet files using **batch** processing:


# CELL ********************

item_df = spark.read.parquet('Files/landing/item')
display(item_df)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### 🔄 Convert Batch to Streaming
# 
# After validating the output, we can **simply switch** to the `readStream` API! The transformation logic remains identical, except for the need to specify the schema of the input DataFrame.
# 
# **Key Changes:**
# 1. `spark.read` → `spark.readStream`
# 1. Schema can be implicit or defined → `.schema()` is required for streaming operations
# 1. `df.write` → `df.writeStream` (add checkpoint location and trigger)
# 
# Execute the cell below to create your first streaming pipeline:

# CELL ********************

# Create a streaming DataFrame to incrementally read only new parquet files as they arrive
item_stream_df = spark.readStream.schema(item_df.schema).parquet('Files/landing/item')

# Write stream triggered as a single batch (process available files)
item_stream = (item_stream_df.writeStream
    .format('delta')
    .outputMode('append')
    .option('checkpointLocation', 'Files/test/checkpoints/item')
    .trigger(availableNow=True)
    .toTable('dbo.item')
)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### 📊 Monitoring Streaming Jobs
# 
# Streaming jobs can be triggered as **synchronous** or **asynchronous** operations depending on your design requirements.
# 
# **🔍 Check Async Job Status:**
# 
# | Method | What It Shows |
# |--------|---------------|
# | `<stream>.status` | Overall job status (active, stopped, etc.) |
# | `<stream>.lastProgress` | Detailed metrics about the last completed batch |
# | `<stream>.awaitTermination()` | Wait for job completion (synchronous execution) |
# 
# Let's check the status of our streaming job:

# CELL ********************

item_stream.status

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

item_stream.lastProgress

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### ✅ Verify Your First Streaming Pipeline
# 
# Once the `status` shows as **"Stopped"** or `lastProgress` returns metrics, your streaming job has completed!
# 
# **📂 Verify the Table Was Created:**
# 1. Look at the **Lakehouse explorer** on the left sidebar
# 2. Expand the **Tables** section
# 3. Find the `item` table under the `dbo` schema
# 4. Right-click and select **Load data -> Spark**, drag and drop the table onto your Notebook, or query it with SparkSQL!
# 
# > 🎉 **Congratulations!** You've just created your first Spark Structured Streaming pipeline in Microsoft Fabric!
# 
# ---

# MARKDOWN ********************

# ## 🎬 Exploring Your Production Pipeline Data
# 
# Now let's explore the data produced by the **Spark Job Definition** you triggered earlier! It's been streaming data into Bronze and Silver zones while you've been learning Spark fundamentals.
# 
# ### 📊 Silver Zone: Shipment Scan Events
# 
# Run the cell below to count `shipment_scan_event` records processed to the **Silver zone**:
# 
# > 🔄 **Try This**: Run this cell multiple times over the next few minutes - watch the count grow as the streaming job processes more data!

# CELL ********************

# MAGIC %%sql
# MAGIC SELECT COUNT(1) FROM silver.shipment_scan_event

# METADATA ********************

# META {
# META   "language": "sparksql",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### 📦 Silver Zone: Flattened Shipment Data
# 
# Remember the nested JSON structure you saw earlier in `Files/landing/shipment`? Let's see how it's been **flattened** in the Silver zone!
# 
# Query the `silver.shipment` table below to compare:
# 
# **What to Notice:**
# - All nested fields are now **top-level columns** (easier to query!)
# - Clean, standardized **snake_case** column names
# - Data types properly enforced (timestamps, numbers, strings)
# - Ready for joining with other tables and analytics

# CELL ********************

# MAGIC %%sql
# MAGIC SELECT * from silver.shipment LIMIT 100

# METADATA ********************

# META {
# META   "language": "sparksql",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Measure End-to-End Latency: 🥉 Bronze Zone
# 
# Let's measure the **latency** from when scan events are generated at IoT devices to when they land in the **Bronze** Delta table.
# 
# **Latency Calculation:**
# ```
# Latency = Processing Timestamp - Device Generated Timestamp
# ```
# 
# > 💡 **Visualization Tip**: After running the query, click **"New chart"** in the results to visualize latency trends over time!

# CELL ********************

# MAGIC %%sql
# MAGIC SELECT data.generated_at, _processing_timestamp, (unix_millis(_processing_timestamp) - unix_millis(cast(data.generated_at as timestamp))) / 1000.0 AS seconds_latency_from_source 
# MAGIC FROM bronze.shipment_scan_event
# MAGIC group by all
# MAGIC order by cast(data.generated_at as timestamp) desc LIMIT 100

# METADATA ********************

# META {
# META   "language": "sparksql",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Measure End-to-End Latency: 🥈 Silver Zone
# 
# Now let's measure latency to the **Silver zone** - this shows the complete journey through your medallion architecture.
# 
# **Data Flow:**
# ```
# Device → Landing → Bronze → Silver
# ```
# 
# This latency includes:
# - File landing in OneLake
# - Bronze zone processing (ingestion + metadata)
# - Silver zone processing (flattening + transformations + validation)

# CELL ********************

# MAGIC %%sql
# MAGIC SELECT generated_at, _processing_timestamp, (unix_millis(_processing_timestamp) - unix_millis(generated_at)) / 1000.0 AS seconds_latency_from_source 
# MAGIC FROM silver.shipment_scan_event
# MAGIC group by all
# MAGIC order by generated_at desc LIMIT 100

# METADATA ********************

# META {
# META   "language": "sparksql",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ---
# 
# ## ⚡ Part 4: Native Execution Engine - Fabric's Performance Supercharger
# 
# Microsoft Fabric includes a groundbreaking performance optimization called the **Native Execution Engine (NEE)**, powered by **Velox** - an open-source, high-performance query execution engine originally developed at Meta.
# 
# ### 🚀 What is the Native Execution Engine?
# 
# Traditional Apache Spark runs on the Java Virtual Machine (JVM), which, while powerful and flexible, has inherent performance limitations. The Native Execution Engine takes a different approach:
# 
# **Traditional Spark (JVM-Based):**
# - Runs in Java/JVM with garbage collection overhead
# - Row-by-row processing with limited vectorization
# - Multiple serialization/deserialization steps
# 
# **Native Execution Engine (Velox-Based):**
# - Runs in native C++ code (no JVM overhead)
# - **Vectorized processing** using SIMD (Single Instruction, Multiple Data) instructions
# - Optimized for modern CPU architectures
# - Cache-friendly data structures
# 
# ### 🎯 Key Benefits
# 
# | Feature | Impact |
# |---------|--------|
# | **Vectorized Processing** | Process multiple rows simultaneously using SIMD instructions |
# | **Native C++ Performance** | 3-10x faster than JVM for compute-intensive operations |
# | **Zero Code Changes** | Automatically accelerates compatible Spark operations |
# | **Intelligent Fallback** | Seamlessly falls back to Spark for unsupported operations |
# 
# ### 🔬 Architecture Comparison
# 
# #### Columnar vs. Row Memory
# ![Native Execution Engine vs JVM Architecture](https://github.com/voidfunction/FabCon25SparkWorkshop/blob/main/module-4-tuning-optimizing-scaling/_media/nee-vs-spark-jvm.excalidraw.png?raw=true)
# 
# #### Vectorized vs. Scalar Hardware Processing
# ![SIMD Vectorization in Action](https://github.com/voidfunction/FabCon25SparkWorkshop/blob/main/module-4-tuning-optimizing-scaling/_media/nee-vs-spark-jvm-simd.excalidraw.png?raw=true)
# 
# ### 💡 When Does NEE Accelerate Your Queries?
# 
# The Native Execution Engine automatically optimizes:
# - **Filters & Aggregations** - WHERE clauses, GROUP BY operations
# - **Joins** - INNER, LEFT, RIGHT joins with predicates
# - **Projections** - SELECT with column transformations
# - **Window Functions** - ROW_NUMBER, RANK, aggregate windows
# - **String Operations** - Pattern matching, parsing, transformations
# 
# > 🎉 **Best Part:** There's no extra cost to use it - simply check the Acceleration box in your Environment Item or enable inline as a Spark session configuration (`spark.native.enabled`)!
# 
# ---
# 
# ### 🧪 Let's Benchmark It!
# 
# We'll run a **complex analytical query** twice:
# 1. With **traditional Spark engine**
# 2. With **Native Execution Engine enabled**
# 
# **The Query:** A multi-table join analyzing shipment exceptions with aggregations and window functions.
# 
# Run the next cell to define our benchmarking utility:


# CELL ********************

from pyspark.sql import DataFrame
import time

def _benchmark_native_engine(self: DataFrame):
    """
    Benchmark helper that runs the same query twice:
    1. With Native Execution Engine disabled (traditional Spark)
    2. With Native Execution Engine enabled (Velox-powered)
    
    Validates that Velox was used and reports the performance difference.
    """
    import time

    spark = self.sparkSession

    # Minimize snapshot generation overhead
    spark.conf.set('spark.microsoft.delta.parallelSnapshotLoading.enabled', True)
    spark.conf.set('spark.microsoft.delta.snapshot.driverMode.enabled', True)
    spark.conf.set("spark.synapse.vegas.useCache", "false")
    
    # ===== Run 1: Traditional Spark Engine =====
    spark.conf.set("spark.native.enabled", "false")
    spark.sparkContext.setJobDescription(f"Spark Query (JVM)")
    
    start_time_spark = time.time()
    self.limit(1000).collect()  # Execute query
    end_time_spark = time.time()
    
    duration_spark = (end_time_spark - start_time_spark) * 1000  # Convert to ms
    print(f"⏱️ Execution time w/ Spark (JVM): {duration_spark:.2f} ms")

    # ===== Run 2: Native Execution Engine =====
    spark.conf.set("spark.native.enabled", "true")
    spark.sparkContext.setJobDescription(f"Native Query (Velox)")
    
    start_time_native = time.time()
    q = self.limit(1000)
    q.collect()  # Execute query
    end_time_native = time.time()
    
    spark.sparkContext.setJobDescription(None)
    duration_native = (end_time_native - start_time_native) * 1000  # Convert to ms

    # Validate that Velox was actually used
    execution_plan = q._jdf.queryExecution().executedPlan().toString()
    assert "Velox" in execution_plan, f"❌ Plan did not contain Velox: {execution_plan}"

    # Restore default cache setting
    spark.conf.set("spark.synapse.vegas.useCache", "true")

    # Report results
    print(f"⚡ Execution time w/ Native (Velox): {duration_native:.2f} ms")
    times_faster = duration_spark / duration_native
    
    if duration_spark > duration_native:
        print(f"\n🎉 Native Execution Engine was \033[1;34m{times_faster:.1f}x faster\033[0m!")
    else:
        print(f"\n📊 Results were comparable (difference: {abs(times_faster - 1):.1f}x)")

spark.conf.set('spark.microsoft.delta.parallelSnapshotLoading.enabled', True)
spark.conf.set('spark.microsoft.delta.snapshot.driverMode.enabled', True)
spark.conf.set("spark.native.enabled", True)

# Attach the benchmark method to DataFrame
DataFrame.benchmark_native_engine = _benchmark_native_engine

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### 🎯 The Benchmark Query
# 
# Now let's put the Native Execution Engine to the test with a **complex analytical query** that's perfect for demonstrating NEE performance gains!
# 
# **What This Query Does:**
# - 📊 **Analyzes shipment exceptions** (damaged goods, weather delays, vehicle issues, customs holds)
# - 🔗 **5-way table joins** across shipments, orders, items, customers, and scan events
# - 🧮 **Multiple aggregations** - counting shipments, customers, summing values, calculating averages
# - 🕐 **Time-based calculations** - resolution times, late delivery penalties
# - 🎯 **Complex filtering** - hazardous materials, fragile items, specific exception codes
# 
# This is exactly the type of query that benefits most from vectorized execution!
# 
# **Step 1: See the Results**
# 
# First, let's run the query and see what business insights it produces:

# CELL ********************

df = spark.sql("""
    -- Shipment Exception Analysis
    SELECT 
        sse.exception_code,
        i.category,
        COUNT(DISTINCT sse.shipment_id) as affected_shipments,
        COUNT(DISTINCT c.customer_id) as affected_customers,
        SUM(s.declared_value) as value_at_risk,
        AVG(s.weight) as avg_weight,
        AVG(s.distance) as avg_distance,
        COUNT(DISTINCT CASE WHEN s.is_hazardous = true OR s.is_fragile = true THEN sse.shipment_id END) as special_handling_count,
        ROUND(SUM(CASE WHEN sse_del.event_timestamp > s.committed_delivery_date 
                  THEN s.late_delivery_penalty_per_day * datediff(sse_del.event_timestamp, s.committed_delivery_date) 
                  ELSE 0 END), 2) as total_penalties
    FROM silver.shipment_scan_event sse
    INNER JOIN silver.shipment s ON sse.shipment_id = s.shipment_id
    INNER JOIN silver.order o ON s.order_id = o.order_id
    INNER JOIN silver.item i ON o.item_id = i.item_id
    INNER JOIN silver.customer c ON s.customer_id = c.customer_id
    LEFT JOIN silver.shipment_scan_event sse_res ON sse.shipment_id = sse_res.shipment_id 
        AND sse_res.related_exception_event_id = sse.event_id
    LEFT JOIN silver.shipment_scan_event sse_del ON s.shipment_id = sse_del.shipment_id 
        AND sse_del.event_type = 'Delivered'
    WHERE sse.exception_code IS NOT NULL
      AND sse.exception_code IN ('DAMAGED', 'WEATHER', 'VEHICLE', 'CUSTOMS')
      AND sse.event_timestamp >= date_sub(current_date(), 180)
    GROUP BY sse.exception_code, i.category
    ORDER BY total_penalties DESC, affected_shipments DESC
    LIMIT 10;
""")

display(df)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### 🏁 Step 2: Benchmark Performance
# 
# Now that you've seen the business results, let's measure how much faster the Native Execution Engine makes this query compared to traditional Spark!
# 
# The next cell will:
# 1. **Run the query with traditional Spark** (JVM-based execution)
# 2. **Run the same query with NEE** (Velox-powered C++ execution)
# 3. **Compare execution times** and show the performance improvement
# 
# **Execute the cell below to run the benchmark:**

# CELL ********************

df.benchmark_native_engine()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### 📊 Understanding the Performance Gains
# 
# **What Just Happened?**
# 
# You just witnessed the power of Microsoft Fabric's Native Execution Engine! The same query executed twice:
# 1. **Traditional Spark (JVM)** - Standard Apache Spark execution with row-based processing
# 2. **Native Engine (Velox)** - Optimized C++ vectorized execution with SIMD operations
# 
# **Why Was It Faster?**
# 
# The Native Execution Engine accelerated this query through:
# - ⚡ **Vectorized Joins** - Processing multiple join operations in parallel using CPU SIMD instructions
# - 📦 **Columnar Processing** - Operating on entire columns of data instead of individual rows
# - 🎯 **Cache-Friendly Operations** - Optimized memory access patterns reduce CPU cache misses
# - 🚀 **Native Code Execution** - No JVM overhead, garbage collection pauses, or serialization costs
# 
# **Real-World Business Impact:**
# 
# | Scenario | Before (Spark) | With NEE | Benefit |
# |----------|----------------|----------|---------|
# | 📊 Dashboard Refresh | 5 minutes | 1 minute | Users see insights 5x faster |
# | 🔄 Hourly ETL Jobs | 2 hours | 30 minutes | Run more frequently or process more data |
# | 💰 Compute Costs | $1000/month | $300/month | 70% cost reduction on this workload |
# | 👥 Concurrent Users | 10 users | 30+ users | Support more analysts without slowdowns |
# 
# **The Best Part?** 
# 
# You don't need to:
# - ❌ Rewrite your code
# - ❌ Change your queries  
# - ❌ Learn new APIs
# - ❌ Pay extra for the feature
# 
# Fabric automatically:
# - ✅ Detects compatible operations
# - ✅ Routes them to the Native Engine
# - ✅ Falls back to Spark when needed
# - ✅ Optimizes your queries transparently
# 
# > 💡 **Pro Tip:** NEE provides the biggest performance gains for queries with:
# > - Complex multi-table joins
# > - Heavy aggregations (SUM, COUNT, AVG)
# > - String operations and filtering
# > - Window functions
# > - Large datasets (millions+ rows)
# 
# ---


# MARKDOWN ********************

# ---
# 
# ## 🤖 Part 5: AI Transformations - Built-in Generative AI for Data
# 
# Microsoft Fabric provides **AI Functions** - a powerful set of built-in capabilities that let you transform and enrich your data using generative AI with just **a single line of code**. No complex infrastructure, no model deployment, no AI expertise required!
# 
# ### 🌟 What Are AI Functions?
# 
# AI Functions leverage industry-leading large language models (LLMs) directly within your data workflows. They're designed for **all business professionals** - from developers to analysts - making AI accessible to everyone working with data in Fabric.
# 
# **Available AI Functions:**
# 
# | Function | What It Does | Use Case Example |
# |----------|--------------|------------------|
# | **ai.analyze_sentiment** | Detect emotional tone (positive, negative, neutral, mixed) | Analyze customer reviews, social media feedback |
# | **ai.classify** | Categorize text according to custom labels | Organize support tickets, classify products |
# | **ai.embed** | Generate vector embeddings for semantic search | Build recommendation systems, similarity search |
# | **ai.extract** | Extract specific entities (names, locations, dates) | Parse documents, extract key information |
# | **ai.fix_grammar** | Correct spelling, grammar, and punctuation | Clean user-generated content |
# | **ai.generate_response** | Generate custom responses based on your prompts | Create product descriptions, email templates |
# | **ai.similarity** | Compare semantic meaning between texts | Find duplicates, match similar items |
# | **ai.summarize** | Generate concise summaries of long text | Summarize reports, meeting notes |
# | **ai.translate** | Translate text to different languages | Localize content, multilingual analysis |
# 
# ### 🎯 Key Benefits
# 
# - **🚀 No Setup Required** - Built-in AI endpoint powered by Azure OpenAI (gpt-4o-mini by default)
# - **💰 Cost-Effective** - No separate AI service costs, consumption billed through Fabric capacity
# - **⚡ High Performance** - Default concurrency of 200 for fast parallel processing
# - **🔧 Simple API** - Single line of code to transform your data
# - **🌐 Multi-Model Support** - Configure Azure OpenAI or Azure AI Foundry models
# - **🛡️ Enterprise-Ready** - Built-in content filtering and responsible AI guardrails
# 
# ### 💼 Real-World Scenario: Analyzing Delivery Reviews
# 
# At **McMillan Industrial Group**, thousands of shipment delivery reviews are collected daily from field technicians and customers. Let's use AI Functions to analyze this feedback and extract actionable insights!
# 
# **The Business Challenge:**
# - Manual review analysis is time-consuming and subjective
# - Need to identify sentiment trends across thousands of reviews
# - Want to route negative feedback for immediate attention
# - Extract common themes and issues from unstructured text
# 
# **The AI Solution:**
# Use `ai.analyze_sentiment` to automatically classify reviews as positive, negative, neutral, or mixed - then trigger workflows based on sentiment scores.
# 
# ---
# 
# ### 📊 Step 1: Identify Data to be Augmented with AI Functions
# 
# First, let's query delivery reviews from our Silver zone:


# CELL ********************

df = spark.sql("""
SELECT 
    delivery_review
FROM silver.shipment_scan_event 
WHERE 
    event_type = 'Delivered'
LIMIT 1000""")
display(df)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Step 2: Apply Sentiment Analysis AI Function
# 
# Run the below cell to see the sentiment of each delivery review:

# CELL ********************

from synapse.ml.spark.aifunc.DataFrameExtensions import AIFunctions

# Analyze sentiment of delivery reviews using built-in AI
df_sentiment = df.select("delivery_review").distinct().limit(10) \
    .ai.analyze_sentiment(
        input_col="delivery_review", 
        output_col="delivery_sentiment", 
        concurrency=200  # Process up to 200 rows in parallel
    )

display(df_sentiment)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### 🎉 That's It - One Line of AI-Powered Analysis!
# 
# **What Just Happened?**
# 
# With a single `.ai.analyze_sentiment()` call, Fabric:
# 1. ✅ Automatically called the built-in Azure OpenAI endpoint
# 2. ✅ Sent each review to a GPT model for sentiment analysis
# 3. ✅ Processed up to 200 multi-language reviews in parallel for speed
# 4. ✅ Returned structured sentiment labels: `positive`, `negative`, `neutral`, or `mixed`
# 5. ✅ Applied content safety filters automatically
# 
# **Business Value:**
# - 📊 **Instant Insights** - No manual review reading required
# - 🚨 **Proactive Alerts** - Route negative reviews to customer service immediately
# - 📈 **Trend Analysis** - Track sentiment over time to measure service quality
# - 💰 **Cost Savings** - Automate thousands of review classifications per day
# 
# **Key Parameters:**
# - `input_col` - The column containing text to analyze
# - `output_col` - Where to store the sentiment result
# - `concurrency` - How many parallel AI calls (default: 200, increases speed!)
# 
# ---

# MARKDOWN ********************

# ### Auto Compaction: 🔄 Self-Optimizing Delta Tables 
# 
# One of the powerful features of Delta Lake in Microsoft Fabric is **Auto Compaction** - a background process that automatically optimizes table storage without manual intervention.
# 
# #### Why Table Compaction Matters
# 
# As streaming data writes to Delta tables, many small files accumulate over time. This can impact query performance because:
# - More files = more metadata to track
# - Small files are inefficient for distributed processing
# - Query engines must open and read many files instead of fewer, larger ones
# 
# #### How Auto Compaction Works
# 
# Auto Compaction **automatically** evaluates after write operations to check if compaction is need to:
# - Merge small files into larger, optimized files
# - Maintain optimal file sizes (typically 128 MB - 1 GB)
# - Reduce table maintenance overhead
# - Keep query performance fast over time
# 
# **The best part?** No manual or scheduled `OPTIMIZE` jobs - it just works!
# 
# #### 📊 Inspecting Auto Compaction in Action
# 
# Let's examine how Auto Compaction has been maintaining the `bronze.shipment_scan_event` table while the streaming job runs.
# 
# **Step 1:** Run the cell below to see the **current state** of the table - notice the `numFiles` column showing how many files exist in the current version.
# 
# > 💡 **What to Look For:** The `numFiles` value represents the number of files in the latest version of the Delta table. Although the streaming process is frequently appending new files to the table, the `numFiles` value should stay small as Auto Compaction runs anytime there's at least 50 small files.


# CELL ********************

# MAGIC %%sql
# MAGIC DESCRIBE DETAIL silver.shipment_scan_event

# METADATA ********************

# META {
# META   "language": "sparksql",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# **Step 2:** Run the cell below to see how many files have been **written** to the table since streaming started.
# 
# > 💡 **What to Expect:** The `FilesWritten` count will be significantly higher than `numFiles` from the previous step - this gap shows Auto Compaction at work!

# CELL ********************

spark.sql("DESCRIBE HISTORY bronze.shipment_scan_event").createOrReplaceTempView('bronze_shipment_scan_event_history')

df = spark.sql("""
    SELECT 
        COUNT(operationMetrics) AS StreamBatches, 
        SUM(operationMetrics.numAddedFiles) AS FilesWritten 
    FROM bronze_shipment_scan_event_history
    WHERE operation NOT IN ('OPTIMIZE', 'CREATE TABLE')
""")
display(df)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# **Step 3:** Run the cell below to see how many times Auto Compaction (`OPTIMIZE`) has run automatically.
# 
# _Each record represents a distinct `OPTIMIZE` operation. Expand the `operationParameters` column and you'll see a tag indicating that these were triggered automatically_
# 
# > 💡 **Key Insight:** Each `OPTIMIZE` operation merged multiple small files into larger, optimized files - all without any manual intervention!

# CELL ********************

# MAGIC %%sql
# MAGIC SELECT
# MAGIC     *
# MAGIC FROM bronze_shipment_scan_event_history 
# MAGIC WHERE operation = 'OPTIMIZE'

# METADATA ********************

# META {
# META   "language": "sparksql",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# #### 🎯 Key Takeaway: Zero-Maintenance Performance
# 
# **What Just Happened:**
# - The streaming job wrote **hundreds of small files** as data arrived in micro-batches
# - Auto Compaction **automatically detected** the file accumulation
# - The system **merged small files** into optimized larger files multiple times
# - The final table has **far fewer files** than were originally written
# - Query performance remains **fast and consistent** over time
# 
# **Business Impact:**
# - **No Manual Maintenance Required** - No need to schedule `OPTIMIZE` commands
# - **Continuous Performance** - Tables stay fast even as data grows
# - **Reduced Operational Overhead** - Focus on analytics, not table maintenance
# - **Cost Efficiency** - Optimized storage and faster queries reduce compute costs
# 
# > 🚀 **Pro Tip:** Auto Compaction can be enabled on your Delta tables to automatically optimize storage. For manual control, you can also run `OPTIMIZE` commands as part of your pipeline or on a schedule.
# ```python
# spark.conf.set('spark.databricks.delta.autoCompact.enabled', True)
# ```
# 
# ---


# MARKDOWN ********************

# ### ✅ Silver Zone Complete
# 
# **What You've Accomplished:**
# 
# Your streaming data is now:
# - **Parsed** from complex JSON structures
# - **Cleaned** with standardized naming and types
# - **Ready** for dimensional modeling in the Gold layer
# 
# The Silver zone is where the magic happens - raw, messy data transformed into analytics-ready tables that business users can trust.


# MARKDOWN ********************

# ---
# 
# ## 🎓 Key Takeaways & Next Steps
# 
# ### 🏆 What You've Accomplished
# 
# Congratulations! You've explored core data engineering concepts within a production-grade medallion architecture in Microsoft Fabric. Here's what you've learned:
# 
# #### 1. Spark Fundamentals
# - **DataFrame API**: Reading Parquet and JSON files with distributed processing
# - **Spark SQL**: Querying data using `%%sql` magic commands and temporary views
# - **Nested Data Handling**: Exploding arrays and flattening complex JSON structures
# - **Batch vs Streaming**: Understanding the unified DataFrame API for both modes
# 
# #### 2. Structured Streaming
# - **Why Streaming?**: Incremental processing, exactly-once semantics, and fault tolerance
# - **Streaming Patterns**: Converting batch code to streaming with minimal changes
# - **Monitoring**: Using `.status` and `.lastProgress` to track job execution
# - **Trigger Modes**: Processing data with `availableNow=True` for batch-style execution
# 
# #### 3. Exploring Data in a Medallion Architecture
# - **Querying Silver Tables**: Accessing cleaned, analytics-ready data
# - **Measuring Latency**: Tracking end-to-end data processing time from source to Silver
# - **Data Quality**: Understanding how Bronze preserves raw data while Silver provides business value
# - **Production Pipelines**: Observing a running Spark Job Definition processing real-time data
# 
# #### 4. Native Execution Engine (Velox)
# - **Dramatic Performance Gains**: Experienced 2-10x faster query execution on real analytical workloads
# - **No extra cost**: Enable on new or existing workloads without any cost multipliers. 2x faster jobs == 2x cheaper workloads!
# 
# #### 5. AI Functions - Generative AI for Data
# - **Built-in AI**: Using Azure OpenAI directly in Spark DataFrames with no infrastructure
# - **One-Line Transformations**: Sentiment analysis, classification, summarization, and extraction
# - **Real Business Value**: Analyzing delivery reviews and extracting insights at scale
# - **Enterprise Ready**: High concurrency (200 parallel calls) with content safety built-in
# 
# #### 6. Delta Lake Optimization
# - **Auto Compaction**: Self-optimizing tables that merge small files automatically
# - **Zero Maintenance**: Understanding how Fabric maintains performance without manual OPTIMIZE commands
# - **Production Monitoring**: Tracking table history and file operations over time
# 
# ---
# 
# ### 🎬 Your Streaming Job Status
# 
# **Remember:** Your Spark Job Definition (`StreamBronzeAndSilver`) is still running in the background!
# 
# **Current State:**
# - Generating synthetic data simulating McMillan Industrial Group operations
# - Processing Landing → Bronze → Silver zones continuously
# - Data accumulating in Delta tables (query counts to see growth!)
# 
# **What You Can Do:**
# - **Re-run queries** in this notebook to see growing data volumes in real-time
# - **Check the Lakehouse** explorer to browse tables and schemas
# - **Stop the job** when finished (workspace → Spark Job Definition → Cancel)
# 
# ---
# 
# ### 🚀 What's Next?
# 
# Continue your journey through the McMillan Industrial Group data pipeline:
# 
# | Experience | What You'll Learn |
# |----------|-------------------|
# | **🥇 2_ModelData** Notebook | Build dimensional models in Fabric Warehouse using T-SQL |
# | **🤖 3_SalesAndLogisticsAgent** | Chat with your data using natural language via a Data Agent |
# 
# ### 📚 Additional Resources
# 
# Expand your knowledge with these official docs:
# 
# - [Microsoft Fabric Documentation](https://learn.microsoft.com/fabric/)
# - [Spark Structured Streaming Guide](https://spark.apache.org/docs/latest/structured-streaming-programming-guide.html)
# - [Delta Lake Best Practices](https://docs.delta.io/latest/best-practices.html)
# - [Fabric AI Functions](https://learn.microsoft.com/en-us/fabric/data-science/ai-functions/overview)
# 
# ---
# 
# ### 🎯 Pro Tips for Your Own Projects
# 
# **When building data pipelines:**
# 1. **Start with batch** - Prototype transformations in batch mode, then convert to streaming
# 2. **Monitor from day one** - Track latency and data quality from the beginning
# 3. **Leverage AI functions** - Transform unstructured text data into structured insights
# 4. **Enable Native Execution** - Get 2-10x performance gains for free in your Spark environments
# 5. **Trust Auto Compaction** - Let Fabric optimize your Delta tables automatically
# 
# ---
# 
# **🎉 Great work completing this notebook!** Move on to the next notebook when you're ready to build the Gold layer! 🚀

