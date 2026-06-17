"""Constants for jumpstart registry."""

from typing import Dict, List

VALID_WORKLOAD_TAGS = [
    "Data Engineering",
    "Data Warehouse",
    "Data Science",
    "Real-Time Intelligence",
    "Data Factory",
    "SQL Database",
    "Power BI",
    "Ontology",
]

VALID_JUMPSTART_TYPES = [
    "Accelerator",
    "Tutorial",
    "Demo",
]

VALID_SCENARIO_TAGS = [
    "Streaming",
    "Modeling",
    "Monitoring",
    "Data Integration",
    "Batch Processing",
]

WORKLOAD_COLOR_MAP = {
    "Data Engineering": {
        "primary": "#1fb6ef", 
        "secondary": "#096bbc"
    },
    "Data Warehouse": {
        "primary": "#1fb6ef", 
        "secondary": "#096bbc"
    },
    "Data Science": {
        "primary": "#1fb6ef", 
        "secondary": "#096bbc"
    },
    "Real-Time Intelligence": {
        "primary": "#fa4e56", 
        "secondary": "#a41836"
    },
    "Data Factory": {
        "primary": "#239C6E", 
        "secondary": "#0C695A"
    },
    "SQL Database": {
        "primary": "#7e5ca7", 
        "secondary": "#633e8f"
    },
    "Ontology": {
        "primary": "#117865", 
        "secondary": "#0C695A"
    },
    "Power BI": {
        "primary": "#ffe642", 
        "secondary": "#e2c718"
    },
}

DEFAULT_WORKLOAD_COLORS = WORKLOAD_COLOR_MAP["Data Engineering"]

# Maps Fabric item types to their parent workload for mermaid diagram simplification
ITEM_WORKLOAD_MAP: Dict[str, str] = {
    "ApacheAirflowJob": "Data Factory",
    "CopyJob": "Data Factory",
    "DataAgent": "Data Science",
    "DataPipeline": "Data Factory",
    "Dataflow": "Data Factory",
    "Environment": "Data Engineering",
    "Eventhouse": "Real-Time Intelligence",
    "Eventstream": "Real-Time Intelligence",
    "GraphQLApi": "Data Engineering",
    "KQLDashboard": "Real-Time Intelligence",
    "KQLDatabase": "Real-Time Intelligence",
    "KQLQueryset": "Real-Time Intelligence",
    "Lakehouse": "Data Engineering",
    "MirroredDatabase": "Data Warehouse",
    "MLExperiment": "Data Science",
    "MountedDataFactory": "Data Factory",
    "Notebook": "Data Engineering",
    "Ontology": "Ontology",
    "OrgApp": "Power BI",
    "Reflex": "Real-Time Intelligence",
    "Report": "Power BI",
    "SemanticModel": "Power BI",
    "SparkJobDefinition": "Data Engineering",
    "SQLEndpoint": "Data Warehouse",
    "SQLDatabase": "SQL Database",
    "UserDataFunction": "Data Science",
    "VariableLibrary": "Data Engineering",
    "Warehouse": "Data Warehouse",
}

# maps between Item names in CICD and their URL routing paths for entry point resolution
ITEM_URL_ROUTING_PATH_MAP = {
    "ApacheAirflowJob": "apacheairflowprojects",
    "CopyJob": "copyjobs",
    "DataAgent": "aiskills",
    "Dataflow": "dataflows",
    "DataPipeline": "pipelines",
    "Environment": "sparkenvironments", 
    "Eventhouse": "eventhouses",
    "Eventstream": "eventstreams",
    "GraphQLApi": "graphql",
    "KQLDatabase": "databases",
    "KQLDashboard": "kustodashboards",
    "KQLQueryset": "queryworkbenches",
    "Lakehouse": "lakehouses",
    "MLExperiment": "mlexperiments",
    "MirroredDatabase": "mirroreddatabases",
    "MountedDataFactory": "mounteddatafactories",
    "Notebook": "synapsenotebooks",
    "Ontology": "ontologies",
    "OrgApp": "apps",
    "Reflex": "reflexes",
    "Report": "reports",
    "SemanticModel": "datasets",
    "SparkJobDefinition": "sparkjobdefinitions",
    "SQLEndpoint": "mirroredwarehouses",
    "SQLDatabase": "sqldatabases",
    "UserDataFunction": "userdatafunctions",
    "VariableLibrary": "variablelibraries",
    "Warehouse": "warehouses",
}

def _validate_tags(tags: List[str], allowed: List[str], field_name: str) -> List[str]:
    """Ensure tag values are non-empty and drawn from the approved list."""
    if not tags:
        raise ValueError(f"At least one value must be provided for {field_name}")

    unknown = [tag for tag in tags if tag not in allowed]
    if unknown:
        allowed_display = ", ".join(allowed)
        unknown_display = ", ".join(unknown)
        raise ValueError(
            f"Unknown {field_name}: {unknown_display}. Allowed values: {allowed_display}."
        )

    return tags
