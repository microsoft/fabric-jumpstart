---
title: Realtime Manufacturing Demo - End-to-end Microsoft Fabric demo that showcases a modern manufacturing scenario: streaming machine telemetry, ingesting SAP master data, building a Lakehouse + Eventhouse, and surfacing insights through Power BI reports, a real-time KQL dashboard, and an AI Data Agent.

toc: true
---

# 🏭 Real-Time Intelligence Manufacturing Demo

End-to-end Microsoft Fabric demo that showcases a modern manufacturing scenario: streaming machine telemetry, ingesting SAP master data, building a Lakehouse + Eventhouse, and surfacing insights through Power BI reports, a real-time KQL dashboard, and an AI Data Agent.

## 🖼️ Architecture

![Architecture](https://raw.githubusercontent.com/DaSenf1860/jumpstartdemos/refs/heads/main/rtimanufacturingdemo_light.svg)

## ✨ What's Inside

- 📡 **Eventstream** — ingests live MQTT machine telemetry into the Eventhouse
- 🔥 **Eventhouse / KQL Database** — stores and queries high-volume sensor data in real time
- 🏞️ **Lakehouse** — holds SAP master data (customers, suppliers, plants, equipment, products) and curated production quality data
- 📓 **Notebooks** — simulate machine data, ingest SAP data, process master data, and run Spark Structured Streaming
- 🪈 **Data Pipeline** — orchestrates the end-to-end flow
- 📊 **Reporting** — Power BI report, Semantic Model, and an MQTT Real-Time Dashboard
- 🤖 **AI Data Agent** — natural-language Q&A over the manufacturing data

## Deploy It

After install fabric-jumpstart, you can deploy this scenario to your Fabric workspace with a single line of code:

```python
jumpstart.install('real-time-manufacturing')
```

## 🛠️ Post-Deployment Setup

After the items are published, open the **`PostDeploymentNotebook`** in the Fabric workspace and run it. It wires everything together — loading sample data, configuring connections, and getting the demo ready to use.

## 🎉 Have Fun

Once the **`PostDeploymentNotebook`** has been running for 5 minutes, you can already see streaming data visualized in the RealtimeDashboard (Reporting Folder).

![RealtimeDashboard](https://raw.githubusercontent.com/DaSenf1860/jumpstartdemos/refs/heads/main/rtidashboard1.png)

You see your core KPIs updating in Realtime, also explore the other pages of this dashboard to drill down on sensor data timeseries and to see the most recent data coming in.

Once the **`PostDeploymentNotebook`** has been running for 10 minutes, you can also go to the Power BI report **`ManufacturingOperationsReport`** and dive deeper on how KPIs have been trending over time, and how they differ by dimensions like sites, time, shifts and machines.

![ManufacturingOperationsReport](https://raw.githubusercontent.com/DaSenf1860/jumpstartdemos/refs/heads/main/powerbireport.png)

You can also open the **🤖 `TalkToManufacturingData`** Data Agent and ask natural-language questions like *"What is the latest sensor data for the compressor motor in the shangai industrial site?"* or *"Which site had the lowest quality in the last 4 weeks?"*

![TalkToManufacturingData](https://raw.githubusercontent.com/DaSenf1860/jumpstartdemos/refs/heads/main/dataagent.png)

Feel free to explore the Notebooks, Eventhouse KQL queries, and pipeline to see how all the pieces fit together. 🔍

## 📁 Repository Layout

| Folder | Purpose |
| --- | --- |
| `AI/` | 🤖 Data Agent definition |
| `Develop/` | 📓 Notebooks (simulation, ingestion, streaming, master data) |
| `Eventhouse/` | 🔥 KQL Eventhouse for real-time telemetry |
| `Eventstream/` | 📡 MQTT and machine-data Eventstreams |
| `Lakehouse/` | 🏞️ Manufacturing Lakehouse |
| `Pipeline_orchestration.DataPipeline/` | 🪈 Orchestration pipeline |
| `PostDeploymentNotebook.Notebook/` | 🛠️ One-click setup after deployment |
| `Reporting/` | 📊 Power BI Report, Semantic Model, KQL Dashboard |
| `deploy.py` | 🚢 fabric-cicd deployment script |
| `parameter.yml` | 🎛️ Environment-specific parameter overrides |
