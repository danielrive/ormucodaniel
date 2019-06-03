"use strict";
const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");
const awsx = require("@pulumi/awsx");
const config = new pulumi.Config("workshop-devops");
const config_aws = new pulumi.Config("aws");

// Variables Stack
const Allowed_IPs_Bastion= config.require("IPs_Allowed").split(',');
const InstanceType= config.require("Instance_Type");
const Environmet= config.require("Environment");
const Project_Name = config.require("Project_Name");
const Deny_IPs= config.require("Denny_IPs").split(',');
const AWS_Region = config_aws.require("region");
// Parameters to Create AWS Resources


// Import Scripts

const Create_Networking = require("./scripts/main.js");

const GlobalParameters = {
    InstanceType: InstanceType,
    AllowedIPs: Allowed_IPs_Bastion,
    Environment: Environmet,
    Region:AWS_Region,
    Project_Name: Project_Name,
    Deny_IPs: Deny_IPs
   
}
const GlobalResources = Create_Networking.CreateGlobalResources(GlobalParameters)



// Resource Creation

