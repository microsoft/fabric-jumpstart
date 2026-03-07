---
title: Capacity Events Monitoring
---

This jumpstart deploys a capacity events monitoring solution into your Microsoft Fabric workspace. It tracks capacity utilization, throttling events, and resource consumption patterns.

## Getting Started

1. [Microsoft Fabric Documentation](https://learn.microsoft.com/en-us/fabric/) — official documentation for the platform.

This is a hyperlink: [Fabric Jumpstart GitHub](https://github.com/microsoft/fabric-jumpstart).

Bold text: **Capacity Events** and also italic text: _capacity utilization monitoring_.

Strikethrough: ~~old monitoring approach~~

> 💡 Heads up — this jumpstart requires a Fabric capacity with at least F2 SKU!
>
> 🧾 You can learn more about [capacity planning](https://learn.microsoft.com/en-us/fabric/enterprise/licenses) in the docs.

## Architecture Overview

### Pipeline Components

And an ordered list:

1. First, capacity metrics are collected from the Fabric REST API
2. A scheduled notebook processes and aggregates capacity data
3. We store results in a `Lakehouse` Delta table and **visualize** in Power BI!

> ❗ Make sure your service principal has the correct admin permissions configured!

Inline-style logo:
![alt text](https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png "Logo Title Text 1")

## Code Examples

```python
from pyspark.sql import SparkSession

spark = SparkSession \
  .builder \
  .appName("CapacityEventsMonitor") \
  .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
  .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog") \
  .getOrCreate()
```

```scala
import org.apache.spark.sql.SparkSession

val spark = SparkSession
  .builder()
  .appName("CapacityEventsMonitor")
  .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension")
  .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog")
  .getOrCreate()
```

```javascript
var s = "JavaScript syntax highlighting"
alert(s)
```

```python
s = "Python syntax highlighting"
print(s)
```

```sql
SELECT capacity_id, AVG(utilization_pct) as avg_util
FROM capacity_events
WHERE event_date >= CURRENT_DATE - INTERVAL 7 DAYS
GROUP BY capacity_id
ORDER BY avg_util DESC
```

```csharp
static async Task Main()
{
    var builder = new HostBuilder();
    builder.ConfigureWebJobs(b =>
    {
        b.AddAzureStorageCoreServices();
        b.AddAzureStorage();
    });
    var host = builder.Build();
    using (host)
    {
        await host.RunAsync();
    }
}
```

```css
/* Custom dashboard styles */
:root {
  --color-bg-primary: #ffffff;
  --color-text-primary: #2d3748;
  --color-text-accent: #2b6cb0;
}
```

```json
{
  "capacityId": "cap-456",
  "utilizationPct": 78.5,
  "throttlingEvents": 3,
  "timestamp": "2025-01-15T10:30:00Z"
}
```

> ☝ Remember to configure your service principal credentials before running the notebooks!

## Data Schema

Colons can be used to align columns.

| Column            | Type          | Description                    |
| ----------------- | ------------- | ------------------------------ |
| `capacity_id`     | `STRING`      | Unique capacity identifier     |
| _timestamp_       | `TIMESTAMP`   | **Event time**                 |
| `utilization_pct` | `DOUBLE`      | Capacity utilization percentage|
| `throttle_count`  | `INTEGER`     | Number of throttling events    |

Three or more...

---

Hyphens

---

Asterisks

---

Underscores

All generate horizontal lines.

## Architecture Diagrams

Images from the web:

![alt text](https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png "Logo Title Text 1")

Online GIFs work too:

![Dark Mode Toggle](https://i.imgur.com/GW48u8l.gif)

## Advanced Configuration

> Always use Delta format for your monitoring tables to benefit from ACID transactions and time travel capabilities.
>
> — Fabric Engineering Team, Best Practices Guide

### Feature Highlights

- Real-time capacity monitoring
- Automatic throttling alerts
- Historical trend analysis
- **Power BI** dashboard with drill-through
- Support for `multi-capacity` environments

### Standard Blockquote

> This is a standard blockquote showing how the capacity monitoring pipeline tracks utilization patterns and throttling events across your Fabric capacities.

---

*That covers the key markdown features available for scenario documentation!*
