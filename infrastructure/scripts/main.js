"use strict";
const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");
const awsx = require("@pulumi/awsx");
const config = new pulumi.Config("workshop-devops");
const config_aws = new pulumi.Config("aws");

let PublicNetworking = {}
let SG_ALB = {}

////////////////////////
/// Export Scripts


const Create_Networking = require("./vpc.js");
const Create_ALB = require("./ALB.js");
const Create_SecurityGroup = require("./SecurityGroup.js");
const Create_Route53 = require("./Route53.js");
const Create_AutoScaling = require("./ASG.js");


////////////////////////////////////////
////////// Create Global Resources

///////////////////////////////////////
////// Create Global Resources

function CreateGlobalResources(GlobalParameters) {

    ///////////////////////////////////////
    ////// Public Networking Parameters

    const ParametersPublicNetworking = {
        Number_Subnets: 2,
        Environment: GlobalParameters.Environmet,
        Region: GlobalParameters.AWS_Region,
        Project_Name: GlobalParameters.Project_Name,
        Deny_IPs: GlobalParameters.Deny_IPs
    }

    ///////////////////////////////////////
    ////// Public Networking Creation

    PublicNetworking = Create_Networking.Create_Public_Networking(ParametersPublicNetworking);


    ///////////////////////////////////////
    ////// SG ALB Parameters

    const ParametersSGALB = {
        Environment: GlobalParameters.Environmet,
        Region: GlobalParameters.AWS_Region,
        Project_Name: GlobalParameters.Project_Name,
        VPCId: PublicNetworking.vpc_id
    }

    ///////////////////////////////////////
    ////// SG ALB Creation

    SG_ALB = Create_SecurityGroup.CreateSGALB(ParametersSGALB);

    ///////////////////////////////////////
    ////// ALB Parameters

    const ParametersALB = {
        Environment: GlobalParameters.Environmet,
        Region: GlobalParameters.AWS_Region,
        Project_Name: GlobalParameters.Project_Name,
        SecurityGroupALB: SG_ALB,
        Subnets: PublicNetworking.Public_Subnets
    }

    ///////////////////////////////////////
    ////// ALB Creation

    const ALB = Create_ALB.CreateALB(ParametersALB);

    const ParametersTargetGroup = {
        VPCId: PublicNetworking.vpc_id,
        Project_Name: GlobalParameters.Project_Name,
        Port: 80
    }

    /////// ALB Information
    const ALB_DATA = {
        ALB_DNS: ALB.alb_dns
    }

    ///////////////////////////////////////
    ////// Target Group Creation

    const TargetGroup = Create_ALB.Create_Target(ParametersTargetGroup);


    ///////////////////////////////////////
    ////// SG Instances Parameters


    const ParametersSGInstances = {
        VPCId: PublicNetworking.vpc_id,
        Project_Name: GlobalParameters.Project_Name,
        SG_ALB: SG_ALB
    }

    ///////////////////////////////////////
    ////// SG Instances Creation

    const ASGInstances = Create_SecurityGroup.CreateSGInstances(ParametersSGInstances);




    ///////////////////////////////////////
    ////// Auto Scaling Group Parameters

    const ParametersAutoScaling = {

        Project_Name: GlobalParameters.Project_Name,
        PrivateSubnets: PublicNetworking.Public_Subnets,
        TargetGroup: TargetGroup.ARN_TG,
        KeyName: "ormuco_daniel",
        SGInstances: ASGInstances,
        AMI: `ami-0c55b159cbfafe1f0`,
        max_instances: 2,
        min_instances: 2,
        InstancesType: GlobalParameters.InstanceType
    }

   const AutoScaling = Create_AutoScaling.Create_ASG(ParametersAutoScaling);

return ALB.alb_dns;

}
exports.CreateGlobalResources = CreateGlobalResources


