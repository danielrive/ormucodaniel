"use strict";
const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");
const awsx = require("@pulumi/awsx");

let ALBListener443 = {}

function CreateALB(parameters) {

    //////////////////////////////////
    // ALB Creation

    // Application Load Balancer Creation 
    const ALB_Workshop = new aws.elasticloadbalancingv2.LoadBalancer(`ALB-Woerkshop-${parameters.Project_Name}`,
        {
            enableCrossZoneLoadBalancing: true,
            enableDeletionProtection: false,
            enableHttp2: true,
            idleTimeout: 60,
            internal: false,
            ipAddressType: `ipv4`,
            loadBalancerType: `application`,
            name: `ALB-Workshop-${parameters.Project_Name_Name}`,
            tags: {
                Name: `ALB-Woerkshop-${parameters.Project_Name_Name}`,
                Environment: parameters.Environment
            },
            securityGroups: [parameters.SecurityGroupALB],
            subnets: parameters.Subnets,
        }
    );

    // ALL Listeners with http will redirect to https
    // Creation Listener 80

    const ALBListener80 = new aws.elasticloadbalancingv2.Listener(`${parameters.Project_Name}-Listener-HTTP`, {

        defaultActions: [{
            /*
                 targetGroupArn: TargetGroup.arn,
                 type: `forward`
            */
            redirect: {
                port: "443",
                protocol: "HTTPS",
                statusCode: "HTTP_301",
            },
            type: "redirect",
        }],
        loadBalancerArn: ALB_Workshop.arn,
        port: 80,
        protocol: `HTTP`,
        tags: {
            Name: `${parameters.Project_Name}-Listener-HTTP`
        }
    }

    );


    ALBListener443 = new aws.elasticloadbalancingv2.Listener(`${parameters.Project_Name}-Listener-HTTPS`, {
        certificateArn: "arn:aws:acm:us-east-1:814847886138:certificate/76839a2d-8104-4e5d-a6c8-0a3994c07c17",
        defaultActions: [{
            fixedResponse: {
                contentType: "text/plain",
                messageBody: "Load Balancer Error",
                statusCode: "404",
            },
            type: "fixed-response",
        }],
        loadBalancerArn: ALB_Workshop.arn,
        port: 443,
        protocol: `HTTPS`,
        sslPolicy: "ELBSecurityPolicy-2016-08",
        tags: {
            Name: `${parameters.Project_Name}-Listener-HTTPS`
        }
    }
    );

    //////////////////////////////////
    // Outputs

    const information_alb = {
        alb_dns: ALB_Workshop.dnsName,
        alb_arn: ALB_Workshop.arn,
        alb_name: ALB_Workshop.name
    }
    return information_alb;
}

function create_target(parameters_tg) {

    //////////////////////////////////
    // Target Group to ALB Creation

    const TargetGroup = new aws.elasticloadbalancingv2.TargetGroup(`TG-${parameters_tg.Project_Name}`,
        {
            deregistrationDelay: 20,
            healthCheck:
            {
                healthyThreshold: 3,
                interval: 5,
                path: "/",
                port: parameters_tg.Port,
                protocol: `HTTP`,
                unhealthyThreshold: 2,
                timeout: 2
            },
            port: parameters_tg.Port,
            protocol: `HTTP`,
            targetType: `instance`,
            vpcId: parameters_tg.VPCId,
            tags: {
                Name: `TG-${parameters_tg.Project_Name}`
            }
        }
    );

    // Create Rule in Listener ALB
    const ALBListenerRule = new aws.elasticloadbalancingv2.ListenerRule(`Rule-${parameters_tg.Project_Name}`, {
        actions: [{
            targetGroupArn: TargetGroup.arn,
            type: `forward`
        }],
        conditions: [{
            field: `host-header`,
            values: `*.com`

        }],
        listenerArn: ALBListener443.arn,
        priority: 1
    });

    const Information_Target = {
        ARN_TG: TargetGroup.arn,
        TG_Name: TargetGroup.name
    }

    return Information_Target;
}

exports.CreateALB = CreateALB;
exports.Create_Target = create_target;
