const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");
const awsx = require("@pulumi/awsx");


function SG_ALB(parameters) {

    const SG_ALB = new aws.ec2.SecurityGroup(`SG-ALB-${parameters.Project_Name}`,
        {
            vpcId: parameters.VPCId,
            tags: {
                Name: `SG-ALB-${parameters.Project_Name}`
            }

        },
    );

    const SG_ALB_IRules = new aws.ec2.SecurityGroupRule(`${parameters.Project_Name}_IRules`,
        {
            fromPort: 80,
            cidrBlocks: ["0.0.0.0/0"],
            protocol: "tcp",
            toPort: 80,
            type: "ingress",
            securityGroupId: SG_ALB.id
        }
    );

    const SG_ALB_IRules2 = new aws.ec2.SecurityGroupRule(`${parameters.Project_Name}_IRules2`,
        {
            fromPort: 443,
            cidrBlocks: ["0.0.0.0/0"],
            protocol: "tcp",
            toPort: 443,
            type: "ingress",
            securityGroupId: SG_ALB.id
        }
    );

    const SG_ALB_ERules = new aws.ec2.SecurityGroupRule(`${parameters.Project_Name}_ERules`,
        {
            fromPort: 0,
            cidrBlocks: ["0.0.0.0/0"],
            protocol: "-1",
            toPort: 65535,
            type: "egress",
            securityGroupId: SG_ALB.id
        }
    );
    return SG_ALB.id;
}  

exports.CreateSGALB = SG_ALB



function SG_Instances(parameters) {

    const SG_Instances = new aws.ec2.SecurityGroup(`SG-Instances-${parameters.Project_Name}`,
        {
            vpcId: parameters.VPCId,
            tags: {
                Name: `SG-Instances-${parameters.Project_Name}`
            }

        },
    );

    const SG_Instances_IRules = new aws.ec2.SecurityGroupRule(`SG-Instances-${parameters.Project_Name}_IRules`,
        {
            fromPort: 22,
            cidrBlocks: ["172.16.0.0/16"],
            protocol: "tcp",
            toPort: 22,
            type: "ingress",
            securityGroupId: SG_Instances.id
        }
    );

    const SG_Instances_IRules2 = new aws.ec2.SecurityGroupRule(`SG-Instances-${parameters.Project_Name}_IRules2`,
        {
            fromPort: 80,
            sourceSecurityGroupId: parameters.SG_ALB,
            protocol: "tcp",
            toPort: 80,
            type: "ingress",
            securityGroupId: SG_Instances.id
        }
    );

    const SG_Instances_ERules = new aws.ec2.SecurityGroupRule(`SG-Instances-${parameters.Project_Name}_ERules`,
        {
            fromPort: 0,
            cidrBlocks: ["0.0.0.0/0"],
            protocol: "-1",
            toPort: 65535,
            type: "egress",
            securityGroupId: SG_Instances.id
        }
    );
    return SG_Instances.id;
}


exports.CreateSGInstances = SG_Instances