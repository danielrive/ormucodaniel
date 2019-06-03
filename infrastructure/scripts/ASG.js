"use strict";
const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");
const awsx = require("@pulumi/awsx");

let ASG_Creation = {}



function Create_ASG(parameters) {

    let userData = `#!/bin/bash
apt update 
apt install -y python-pip git 
pip install setuptools
pip install wheel
pip install ansible
mkdir -p /home/ubuntu/.ssh
su ubuntu -c "git clone  /home/ubuntu/infrastructure"
su ubuntu -c "cd infrastructure/tecnologia/web-deploy/www ; ansible-playbook -i ../environments/prod/inventory-auto 10_nginx_php.yml"

`;

    const Lanch_Config_ASG = new aws.ec2.LaunchConfiguration(`LC-${parameters.Project_Name}`,
        {
            imageId: parameters.AMI,
            instanceType: parameters.InstancesType,
            namePrefix: `LC-${parameters.Project_Name}`,
            keyName: parameters.KeyName,
            securityGroups: [parameters.SGInstances],
            userData: userData,
        }
    );

    ASG_Creation = new aws.autoscaling.Group(`ASG-${parameters.Project_Name}`,
        {
            vpcZoneIdentifiers: parameters.PrivateSubnets,
            maxSize: parameters.max_instances,
            desiredCapacity: parameters.min_instances,
            minSize: parameters.min_instances,
            healthCheckGracePeriod: 60,
            defaultCooldown: 60*2,
            enabledMetrics: ["GroupMinSize","GroupMaxSize","GroupDesiredCapacity","GroupInServiceInstances","GroupPendingInstances","GroupStandbyInstances","GroupTerminatingInstances","GroupTotalInstances"],
            healthCheckType: "EC2",
            launchConfiguration: Lanch_Config_ASG,
            targetGroupArns: [parameters.TargetGroup],
            tags: [
                {
                    key: "Name",
                    propagateAtLaunch: true,
                    value: `ASG-${parameters.Project_Name}`
                }

            ]
        }

    );

    let ASG_Information = {
        ASG_ARN: ASG_Creation.arn,
        ASG_Name: ASG_Creation.name
    }
    return ASG_Information

}
  
function CreatePolicy(parameters){

    const Create_Scaling_Policy_Up = new aws.autoscaling.Policy(`Scaling-Up-by-CPU-${parameters.Project_Name}`, {
        adjustmentType: 'ChangeInCapacity',
        autoscalingGroupName: ASG_Creation.name,
        metricAggregationType: "Average",
        cooldown: 120,
        scalingAdjustment: 2,
        name: 'CPU-Utilization-1',
        policyType: "SimpleScaling"
    });

   const Create_Scaling_Policy_Down = new aws.autoscaling.Policy(`Scaling-Down-by-CPU-${parameters.Project_Name}`, {
        adjustmentType: 'ChangeInCapacity',
        autoscalingGroupName: ASG_Creation.name,
        metricAggregationType: "Average",
        cooldown: 100,
        scalingAdjustment: -1,
        name: 'CPU-Utilization-2',
        policyType: "SimpleScaling"
    });

    let ASG_Information = {
        ASG_CPU_Policy_ARN_Up: Create_Scaling_Policy_Up.arn,
        ASG_CPU_Policy_ARN_Down: Create_Scaling_Policy_Down.arn
    }
    
    return ASG_Information;
}


exports.Create_ASG = Create_ASG
exports.CreatePolicy = CreatePolicy
