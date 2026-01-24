"""
Table and dimension configuration for ArcFlow

This file defines:
1. Table registry - All source tables to process
2. Dimension registry - Multi-source dimensional models
3. Custom transformations - Business logic per table/zone

Edit this file to configure your lakehouse pipelines.
"""

from pyspark.sql import DataFrame
import pyspark.sql.functions as sf
from arcflow import FlowConfig, StageConfig
from arcflow.transformations.zone_transforms import register_zone_transformer
from pyspark.sql.types import (
    StructType,
    StructField,
    StringType,
    DoubleType,
    LongType,
    ArrayType,
    TimestampType,
    BooleanType,
)


@register_zone_transformer
def explode_data(df: DataFrame) -> DataFrame:
    return df.selectExpr("_meta", "explode(data) as data")


# Configure tables
tables = {}


@register_zone_transformer
def silver_item(df) -> DataFrame:
    df = (
        df.withColumn(
            "is_sdofcertified", sf.col("is_sdofcertified").cast(BooleanType())
        )
        .withColumn("generated_at", sf.col("generated_at").cast(TimestampType()))
        .drop("_processing_timestamp")
    )

    return df


tables["item"] = FlowConfig(
    name="item",
    format="parquet",
    source_uri="Files/landing/item",
    schema=StructType(
        [
            StructField("ItemId", StringType(), True),
            StructField("SKU", StringType(), True),
            StructField("Description", StringType(), True),
            StructField("Brand", StringType(), True),
            StructField("Category", StringType(), True),
            StructField("Subcategory", StringType(), True),
            StructField("Material", StringType(), True),
            StructField("NominalSize", DoubleType(), True),
            StructField("EndConnection", StringType(), True),
            StructField("PressureClass", LongType(), True),
            StructField("Weight", DoubleType(), True),
            StructField("Cost", DoubleType(), True),
            StructField("ListPrice", DoubleType(), True),
            StructField("IsSDOFCertified", StringType(), True),
            StructField("StructuralIndex", DoubleType(), True),
            StructField("SpanRating", DoubleType(), True),
            StructField("OrganizationId", LongType(), True),
            StructField("GeneratedAt", StringType(), True),
        ]
    ),
    description="Item master data",
    trigger_mode='processingTime',
    clean_source=True,
    zones={
        "bronze": StageConfig(
            enabled=True,
            mode="append",
        ),
        "silver": StageConfig(
            enabled=True,
            mode="merge",
            merge_keys=["item_id"],
            custom_transform="silver_item",
        )
    }
)


@register_zone_transformer
def silver_shipment(df) -> DataFrame:
    df = (
        df.selectExpr(
            "_meta.*",
            "data.*",
        )
        .withColumn(
            "committed_delivery_date", sf.to_timestamp("committed_delivery_date")
        )
        .withColumn("ship_date", sf.to_timestamp("ship_date"))
        .withColumn("generated_at", sf.to_timestamp("generated_at"))
        .withColumn("enqueued_time", sf.to_timestamp("enqueued_time"))
        .drop("_meta", "data", "_processing_timestamp")
    )

    return df


tables["shipment"] = FlowConfig(
    name="shipment",
    format="json",
    source_uri="Files/landing/shipment",
    schema=StructType(
        [
            StructField(
                "_meta",
                StructType(
                    [
                        StructField("enqueuedTime", StringType(), True),
                        StructField("producer", StringType(), True),
                        StructField("recordType", StringType(), True),
                        StructField("schemaVersion", StringType(), True),
                    ]
                ),
                True,
            ),
            StructField(
                "data",
                ArrayType(
                    StructType(
                        [
                            StructField("CommittedDeliveryDate", StringType(), True),
                            StructField("CurrentFacilityId", StringType(), True),
                            StructField("CustomerId", StringType(), True),
                            StructField("CustomerName", StringType(), True),
                            StructField("DeclaredValue", DoubleType(), True),
                            StructField("DestinationAddress", StringType(), True),
                            StructField("DestinationCity", StringType(), True),
                            StructField("DestinationCountry", StringType(), True),
                            StructField("DestinationFacilityId", StringType(), True),
                            StructField("DestinationLatitude", DoubleType(), True),
                            StructField("DestinationLongitude", DoubleType(), True),
                            StructField("DestinationState", StringType(), True),
                            StructField("DestinationZipCode", StringType(), True),
                            StructField("Distance", DoubleType(), True),
                            StructField("GeneratedAt", StringType(), True),
                            StructField("Height", DoubleType(), True),
                            StructField("IsFragile", BooleanType(), True),
                            StructField("IsHazardous", BooleanType(), True),
                            StructField(
                                "LateDeliveryPenaltyPerDay", DoubleType(), True
                            ),
                            StructField("Length", DoubleType(), True),
                            StructField("OrderId", StringType(), True),
                            StructField(
                                "OrderLineList", ArrayType(LongType(), True), True
                            ),
                            StructField("OrganizationId", LongType(), True),
                            StructField("OriginAddress", StringType(), True),
                            StructField("OriginCity", StringType(), True),
                            StructField("OriginCountry", StringType(), True),
                            StructField("OriginFacilityId", StringType(), True),
                            StructField("OriginLatitude", DoubleType(), True),
                            StructField("OriginLongitude", DoubleType(), True),
                            StructField("OriginState", StringType(), True),
                            StructField("OriginZipCode", StringType(), True),
                            StructField("RequiresRefrigeration", BooleanType(), True),
                            StructField("ServiceLevel", StringType(), True),
                            StructField("ShipDate", StringType(), True),
                            StructField("ShipmentId", StringType(), True),
                            StructField("SpecialInstructions", StringType(), True),
                            StructField("TrackingNumber", StringType(), True),
                            StructField("Volume", DoubleType(), True),
                            StructField("Weight", DoubleType(), True),
                            StructField("Width", DoubleType(), True),
                        ]
                    ),
                    True,
                ),
                True,
            ),
        ]
    ),
    description="Shipment header",
    trigger_mode='processingTime',
    clean_source=True,
    zones={
        "bronze": StageConfig(
            enabled=True, mode="append", custom_transform="explode_data"
        ),
        "silver": StageConfig(
            enabled=True,
            mode="append",
            custom_transform="silver_shipment",
        )
    }
)


@register_zone_transformer
def silver_shipment_scan_event(df) -> DataFrame:
    df = (
        df.selectExpr(
            "_meta.*",
            "data.*",
        )
        .withColumn("enqueued_time", sf.to_timestamp("enqueued_time"))
        .withColumn("generated_at", sf.to_timestamp("generated_at"))
        .withColumn("event_timestamp", sf.to_timestamp("event_timestamp"))
        .withColumn("delivery_review", sf.col("additional_data").getItem("review"))
        .drop("_meta", "data", "_processing_timestamp")
    )

    return df


tables["shipment_scan_event"] = FlowConfig(
    name="shipment_scan_event",
    format="json",
    source_uri="Files/landing/shipment_scan_event",
    schema=StructType(
        [
            StructField(
                "_meta",
                StructType(
                    [
                        StructField("enqueuedTime", StringType(), True),
                        StructField("producer", StringType(), True),
                        StructField("recordType", StringType(), True),
                        StructField("schemaVersion", StringType(), True),
                    ]
                ),
                True,
            ),
            StructField(
                "data",
                ArrayType(
                    StructType(
                        [
                            StructField(
                                "AdditionalData",
                                StructType(
                                    [
                                        StructField("condition", StringType(), True),
                                        StructField("loadId", StringType(), True),
                                        StructField("method", StringType(), True),
                                        StructField("note", StringType(), True),
                                        StructField("reason", StringType(), True),
                                        StructField("reroute", StringType(), True),
                                        StructField("resolution", StringType(), True),
                                        StructField("review", StringType(), True),
                                        StructField("signedBy", StringType(), True),
                                        StructField("sortDecision", StringType(), True),
                                        StructField("stopSequence", LongType(), True),
                                        StructField(
                                            "transportType", StringType(), True
                                        ),
                                        StructField("vehicleId", StringType(), True),
                                    ]
                                ),
                                True,
                            ),
                            StructField(
                                "CurrentDestinationFacilityId", StringType(), True
                            ),
                            StructField("CurrentOriginFacilityId", StringType(), True),
                            StructField("CurrentServiceLevel", StringType(), True),
                            StructField("EmployeeId", StringType(), True),
                            StructField("EstimatedArrivalTime", StringType(), True),
                            StructField("EventId", StringType(), True),
                            StructField("EventTimestamp", StringType(), True),
                            StructField("EventType", StringType(), True),
                            StructField("ExceptionCode", StringType(), True),
                            StructField("ExceptionSeverity", StringType(), True),
                            StructField("FacilityId", StringType(), True),
                            StructField("GeneratedAt", StringType(), True),
                            StructField("LocationLatitude", DoubleType(), True),
                            StructField("LocationLongitude", DoubleType(), True),
                            StructField("NextWaypointFacilityId", StringType(), True),
                            StructField("OrganizationId", LongType(), True),
                            StructField(
                                "PlannedPathSnapshot",
                                ArrayType(StringType(), True),
                                True,
                            ),
                            StructField("RelatedExceptionEventId", StringType(), True),
                            StructField("ResolutionAction", StringType(), True),
                            StructField("RouteId", StringType(), True),
                            StructField("ScanDeviceId", StringType(), True),
                            StructField("ScheduleId", StringType(), True),
                            StructField("SequenceNumber", LongType(), True),
                            StructField("ShipmentId", StringType(), True),
                            StructField("SortLaneId", StringType(), True),
                            StructField("SortingEquipmentId", StringType(), True),
                            StructField("TrackingNumber", StringType(), True),
                        ]
                    ),
                    True,
                ),
                True,
            ),
        ]
    ),
    description="Events tracking shipment to destination",
    trigger_mode='processingTime',
    clean_source=True,
    zones={
        "bronze": StageConfig(
            enabled=True, mode="append", custom_transform="explode_data"
        ),
        "silver": StageConfig(
            enabled=True,
            mode="append",
            custom_transform="silver_shipment_scan_event",
        )
    }
)

@register_zone_transformer
def silver_order_transformer(df) -> DataFrame:
    df = (
        df.withColumn("order_lines", sf.explode_outer("order_lines"))
            .select("*", "order_lines.*")
            .withColumn("order_date", sf.to_timestamp("order_date", "yyyy-MM-dd"))
            .withColumn("generated_at", sf.to_timestamp("generated_at"))
            .drop("_processing_timestamp", "order_lines")
    )

    return df


tables["order"] = FlowConfig(
    name="order",
    format="parquet",
    source_uri="Files/landing/order",
    schema=StructType([StructField('OrderId', StringType(), True), StructField('OrderNumber', StringType(), True), StructField('OrderDate', StringType(), True), StructField('OrderTotal', DoubleType(), True), StructField('Source', StringType(), True), StructField('CustomerId', StringType(), True), StructField('OrderLines', ArrayType(StructType([StructField('Description', StringType(), True), StructField('ExtendedPrice', DoubleType(), True), StructField('ItemId', StringType(), True), StructField('LineNumber', LongType(), True), StructField('NetWeight', DoubleType(), True), StructField('Quantity', LongType(), True), StructField('SKU', StringType(), True), StructField('UnitPrice', DoubleType(), True), StructField('WarrantyIncluded', BooleanType(), True)]), True), True), StructField('OrganizationId', LongType(), True), StructField('GeneratedAt', StringType(), True)]),
    description="Orders and order lines",
    trigger_mode='processingTime',
    clean_source=True,
    zones={
        "bronze": StageConfig(
            enabled=True, mode="append"
        ),
        "silver": StageConfig(
            enabled=True,
            mode="append",
            custom_transform="silver_order_transformer",
        )
    }
)

@register_zone_transformer
def silver_customer_transformer(df) -> DataFrame:
    df = (
        df.select(
                "*",
                sf.col("delivery_address.address").alias("delivery_address"),
                sf.col("delivery_address.city").alias("delivery_city"),
                sf.col("delivery_address.country").alias("delivery_country"),
                sf.col("delivery_address.latitude").alias("delivery_latitude"),
                sf.col("delivery_address.longitude").alias("delivery_longitude"),
                sf.col("delivery_address.state").alias("delivery_state"),
                sf.col("delivery_address.zip_code").alias("delivery_zip_code"),

                sf.col("billing_address.address").alias("billing_address"),
                sf.col("billing_address.city").alias("billing_city"),
                sf.col("billing_address.country").alias("billing_country"),
                sf.col("billing_address.state").alias("billing_state"),
            )
            .drop("delivery_address", "billing_address")
            .withColumn("generated_at", sf.col("generated_at").cast(TimestampType()))
    )

    return df


tables["customer"] = FlowConfig(
    name="customer",
    format="parquet",
    source_uri="Files/landing/customer",
    schema=StructType([StructField('CustomerId', StringType(), True), StructField('CustomerName', StringType(), True), StructField('Description', StringType(), True), StructField('PrimaryContactFirstName', StringType(), True), StructField('PrimaryContactLastName', StringType(), True), StructField('PrimaryContactEmail', StringType(), True), StructField('PrimaryContactPhone', StringType(), True), StructField('DeliveryAddress', StructType([StructField('Address', StringType(), True), StructField('City', StringType(), True), StructField('Country', StringType(), True), StructField('Latitude', DoubleType(), True), StructField('Longitude', DoubleType(), True), StructField('State', StringType(), True), StructField('ZipCode', StringType(), True)]), True), StructField('BillingAddress', StructType([StructField('Address', StringType(), True), StructField('City', StringType(), True), StructField('Country', StringType(), True), StructField('State', StringType(), True), StructField('ZipCode', StringType(), True)]), True), StructField('OrganizationId', LongType(), True), StructField('GeneratedAt', StringType(), True)]),
    description="Customer master",
    trigger_mode='processingTime',
    clean_source=True,
    zones={
        "bronze": StageConfig(
            enabled=True, mode="append"
        ),
        "silver": StageConfig(
            enabled=True,
            mode="upsert",
            merge_keys=["customer_id"],
            custom_transform="silver_customer_transformer",
        )
    }
)

@register_zone_transformer
def cast_generated_at(df) -> DataFrame:
    return df.withColumn("generated_at", sf.col("generated_at").cast(TimestampType()))

tables["service_level"] = FlowConfig(
    name="service_level",
    format="parquet",
    source_uri="Files/landing/servicelevel",
    schema=StructType([StructField('level', StringType(), True), StructField('weight', LongType(), True), StructField('days', LongType(), True), StructField('OrganizationId', LongType(), True), StructField('GeneratedAt', StringType(), True)]),
    description="Shipment service level",
    trigger_mode='availableNow',
    zones={
        "bronze": StageConfig(
            enabled=True, mode="append"
        ),
        "silver": StageConfig(
            enabled=True,
            mode="upsert",
            merge_keys=["level"],
            custom_transform="cast_generated_at"
        )
    }
)

tables["exception_type"] = FlowConfig(
    name="exception_type",
    format="parquet",
    source_uri="Files/landing/exceptiontype",
    schema=StructType([StructField('code', StringType(), True), StructField('severity', StringType(), True), StructField('description', StringType(), True), StructField('OrganizationId', LongType(), True), StructField('GeneratedAt', StringType(), True)]),
    description="Shipment exception type",
    trigger_mode='availableNow',
    zones={
        "bronze": StageConfig(
            enabled=True, mode="append"
        ),
        "silver": StageConfig(
            enabled=True,
            mode="upsert",
            merge_keys=["code"],
            custom_transform="cast_generated_at"
        )
    }
)

tables["facility"] = FlowConfig(
    name="facility",
    format="parquet",
    source_uri="Files/landing/facility",
    schema=StructType([StructField('FacilityId', StringType(), True), StructField('FacilityName', StringType(), True), StructField('FacilityType', StringType(), True), StructField('Address', StringType(), True), StructField('City', StringType(), True), StructField('State', StringType(), True), StructField('ZipCode', StringType(), True), StructField('Country', StringType(), True), StructField('Latitude', DoubleType(), True), StructField('Longitude', DoubleType(), True), StructField('OrganizationId', LongType(), True), StructField('GeneratedAt', StringType(), True)]),
    description="Shipment facility",
    trigger_mode='availableNow',
    zones={
        "bronze": StageConfig(
            enabled=True, mode="append"
        ),
        "silver": StageConfig(
            enabled=True,
            mode="upsert",
            merge_keys=["facility_id"],
            custom_transform="cast_generated_at"
        )
    }
)

tables["route"] = FlowConfig(
    name="route",
    format="parquet",
    source_uri="Files/landing/route",
    schema=StructType([StructField('RouteId', StringType(), True), StructField('OriginFacilityId', StringType(), True), StructField('DestinationFacilityId', StringType(), True), StructField('TransportMode', StringType(), True), StructField('TravelTimeHours', DoubleType(), True), StructField('OrganizationId', LongType(), True), StructField('GeneratedAt', StringType(), True)]),
    description="Shipment routes",
    trigger_mode='availableNow',
    zones={
        "bronze": StageConfig(
            enabled=True, mode="append"
        ),
        "silver": StageConfig(
            enabled=True,
            mode="upsert",
            merge_keys=["route_id"],
            custom_transform="cast_generated_at"
        )
    }
)