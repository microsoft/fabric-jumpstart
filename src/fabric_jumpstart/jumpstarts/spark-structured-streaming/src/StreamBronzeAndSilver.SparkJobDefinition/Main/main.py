"""
ArcFlow Spark Job Definition - Main Entry Point

This file is the entry point for Microsoft Fabric Spark Job Definition.

DEPLOYMENT INSTRUCTIONS:
========================

1. Build the wheel:
   $ uv build
   
2. In Fabric Workspace:
   - Go to Environment settings
   - Upload: dist/arcflow-0.1.0-py3-none-any.whl
   - Add to environment libraries
   
3. Create Spark Job Definition:
   - Main file: Upload this file (main.py)
   - Reference files: Upload pipeline_config.py
   - Environment: Select environment with arcflow wheel
   - Reference Lakehouse: Select the Lakehouse where data should be written
   
4. Configure (in pipeline_config.py):
   - Define your tables
   - Define dimensions
   - Register DataFrame transformation functions with the `@register_zone_transfomer` decorator
   
5. Run the Spark Job Definition

CONFIGURATION:
==============
- Edit pipeline_config.py to define tables and transformations
- All default paths are in arcflow.config.ArcFlowDefaults
- Override config below in get_pipeline_config() as needed

"""
from arcflow import Controller
from lakegen.generators.mcmillan_industrial_group import McMillanDataGen
import notebookutils
from pyspark.sql import SparkSession
from pipeline_config import tables

import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger(__name__)

if __name__ == "__main__":

    # Step 1: Create Spark Session
    spark = (SparkSession
          .builder
          .appName("sjdsampleapp") 
          .config('spark.databricks.delta.autoCompact.enabled', True)
          .config('spark.microsoft.delta.targetFileSize.adaptive.enabled', True)
          .config('spark.microsoft.delta.optimize.fileLevelTarget.enabled', True)
          .config('spark.microsoft.delta.snapshot.driverMode.enabled', True)
          .config('spark.databricks.delta.properties.defaults.enableDeletionVectors', True)
          .config('spark.databricks.delta.optimizeWrite.enabled', True) # OW enabled since it's streaming micro batches
          .config('spark.native.enabled', True)
          .getOrCreate())
    
    spark_context = spark.sparkContext
    spark_context.setLogLevel("ERROR")

    logger.info("=" * 80)
    logger.info("Starting LakeGen: McMillanDataGen")
    logger.info("=" * 80)
    default_workspace_id = notebookutils.runtime.context['currentWorkspaceId']
    default_lakehouse_id = notebookutils.runtime.context['defaultLakehouseId']
    onelake_endpoint = spark.sparkContext._jsc.hadoopConfiguration().get("trident.onelake.endpoint").split('//')[1]
    target_folder_uri=f"abfss://{default_workspace_id}@{onelake_endpoint}/{default_lakehouse_id}/Files/landing/"

    logger.info(target_folder_uri)
    data_gen = McMillanDataGen(
        target_folder_uri=f"abfss://{default_workspace_id}@{onelake_endpoint}/{default_lakehouse_id}/Files/landing/",
        output_type_map={
            "shipment": "json",
            "shipment_scan_event": "json",
            "route": "parquet",
            "servicelevel": "parquet",
            "facility": "parquet",
            "exceptiontype": "parquet",
            "item": "parquet",
            "customer": "parquet",
            "order": "parquet",
        },
        max_events_per_second=10000,
        concurrenct_threads=1
    )
    data_gen.start(verbose=False)



    logger.info("=" * 80)
    logger.info("Starting ArcFlow ELT Framework")
    logger.info("=" * 80)


    # Configure pipeline
    config = {
        'streaming_enabled': True,
        'checkpoint_uri': "Files/checkpoints",
        'archive_uri': "Files/archive",
        'landing_uri': "Files/landing",
        'trigger_interval': '1 seconds', # default if not set at table level
        'await_termination': True #await_termination needed to keep Spark job from reaching terminal state
    }

    # Step 2: Initialize controller
    logger.info("Initializing ArcFlow Controller...")
    controller = Controller(
        spark=spark,
        config=config,
        table_registry=tables
    )
    logger.info("✓ Controller initialized")

    # Step 3: Run full pipeline
    logger.info("Starting full ELT pipeline...")
    controller.run_full_pipeline(zones=['bronze', 'silver'])