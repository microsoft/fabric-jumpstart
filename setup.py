from setuptools import setup, find_packages

setup(
    name="fabric-jumpstart",
    version="0.1.4b",
    description="Jumpstart Microsoft Fabric demos leveraging fabric-cicd with yaml-driven deployment.",
    license="MIT",
    url="https://github.com/fabric-jumpstart",
    packages=find_packages(),
    include_package_data=True,
    install_requires=["requests", "pyyaml", "fabric-cicd>=0.1.33"],
    python_requires=">=3.8",
    package_data={"fabric_jumpstart": ["yml_templates/*.yml"]},
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
)