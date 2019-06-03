"use strict";
const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");
const awsx = require("@pulumi/awsx");
const config_aws = new pulumi.Config("aws");

const region = config_aws.require("region");

////////////////////////////
//// Networking Resources

let rule_number = 100
let availabilityZones = [`${region}a`, `${region}b`, `${region}c`];

let VPC_Workshop = {}
let NAT_Workshop = {}
let InfoS3Endpoint = {}


function public_networking(parameters) {

    ///////////////////////
    //// VPC Creation  

    let name_vpc = `${parameters.Project_Name}-Workshop`

    VPC_Workshop = new aws.ec2.Vpc(name_vpc, {
        cidrBlock: "10.10.0.0/16",
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
            Name: name_vpc,
        }
    });

    ///////////////////////////////
    //// Public Subnets Creation  

    let Public_Subnets = [];

    for (let i = 0; i < parameters.Number_Subnets; i++) {

        let Name_Sub = `${parameters.Project_Name}-Public-Subnet-${i}`;

        let CIDR_Block = `10.10.${30 + i}.0/24`;

        Public_Subnets[i] = new aws.ec2.Subnet(Name_Sub,
            {
                cidrBlock: CIDR_Block,
                vpcId: VPC_Workshop.id,
                tags: {
                    Name: Name_Sub
                },
                availabilityZone: availabilityZones[i]

            }
        );
    }

    ///////////////////////////////
    //// S3 Endpoint Creation

    InfoS3Endpoint = new aws.ec2.VpcEndpoint(`${parameters.Project_Name}-EnpointS3`, {
        serviceName: `com.amazonaws.${region}.s3`,
        vpcId: VPC_Workshop.id,
    });


    ///////////////////////////////
    //// ACL Creation

    const ACLWorkshop = new aws.ec2.NetworkAcl(`${parameters.Project_Name}-ACL-${name_vpc}`, {
        vpcId: VPC_Workshop.id,
        tags: {
            Name: `${parameters.Project_Name}-ACL-${name_vpc}`
        },
        egress: [{
            action: "allow",
            cidrBlock: "0.0.0.0/0",
            fromPort: 0,
            protocol: "-1",
            ruleNo: 300,
            toPort: 0,
        }],
        ingress: [{
            action: "allow",
            cidrBlock: "0.0.0.0/0",
            fromPort: 0,
            protocol: "-1",
            ruleNo: 300,
            toPort: 0,
        }],
        subnetIds: Public_Subnets
    });

    ///////////////////////////////
    //// ACL Rules Creation


    for (let g = 0; g < parameters.Deny_IPs.length; g++) {
        rule_number = rule_number + g;
        const barNetworkAclRule = new aws.ec2.NetworkAclRule(`ACL-Workshop-Rule-${g}`, {
            // Opening to 0.0.0.0/0 can lead to security vulnerabilities.
            cidrBlock: parameters.Deny_IPs[g], // add a CIDR block here
            egress: false,
            fromPort: 0,
            networkAclId: ACLWorkshop.id,
            protocol: "-1",
            ruleAction: "deny",
            ruleNumber: rule_number,
            toPort: 0,
        });
    }

    ///////////////////////////////
    //// Internet Gateway Creation

    const IGW_Workshop = new aws.ec2.InternetGateway(`${parameters.Project_Name}-IGW`,
        {
            vpcId: VPC_Workshop.id,
            tags: {
                Name: `${parameters.Project_Name}-IGW`
            }
        }
    );
    ///////////////////////////////
    //// Route Table Creation

    const Public_RT = new aws.ec2.RouteTable(`${parameters.Project_Name}-RT-Public`,
        {
            routes: [
                {
                    cidrBlock: "0.0.0.0/0",
                    gatewayId: IGW_Workshop.id
                }
            ],
            tags: {
                Name: `${parameters.Project_Name}-RT-Public`
            },
            vpcId: VPC_Workshop.id
        }
    );

    //////////////////////////////
    //// Route Tables Association

    let RT_Public_Association = [];
    // Associate Route Tables to Private Subnets
    for (let i = 0; i < Public_Subnets.length; i++) {
        let RT_Asso_pub = "RT_Association_pub" + i;
        RT_Public_Association[i] = new aws.ec2.RouteTableAssociation(RT_Asso_pub,
            {
                routeTableId: Public_RT.id,
                subnetId: Public_Subnets[i].id,
                tags: {
                    Name: RT_Asso_pub
                }
            }
        );
    }


    //////////////////////////////
    ////  Outputs Function

    let Information_Networking = {
        vpc_id: VPC_Workshop.id,
        Public_Subnets: Public_Subnets.map(function (n) {
            return n.id
        }),
    }
    return Information_Networking;
}


function private_networking(parameters) {

    let Private_Subnet = [];
    let octets = 100

    for (let i = 0; i < parameters.Number_Subnets; i++) {
        octets = octets + 1
        let Name_Private_Sub = `${parameters.Project_Name}-Private-Subnet-${i}`;
        let CIDR_Block = `10.10.${octets}.0/24`;

        Private_Subnet[i] = new aws.ec2.Subnet(Name_Private_Sub,
            {
                cidrBlock: CIDR_Block,
                vpcId: VPC_Workshop.id,
                tags: {
                    Name: Name_Private_Sub
                },
                availabilityZone: availabilityZones[i]
            },
        );
    }

    const Private_RT = new aws.ec2.RouteTable(`${parameters.Project_Name}-RT-PRIV`,
        {
            routes: [
                {
                    cidrBlock: "0.0.0.0/0",
                    natGatewayId: NAT_Workshop.id
                }
            ],
            tags: {
                Name: `${parameters.Project_Name}-RT-PRIV`
            },
            vpcId: VPC_Workshop.id
        }
    );

    let RT_Private_Association = [];

    // Associate Route Tables to Private Subnets
    for (let i = 0; i < Private_Subnet.length; i++) {

        RT_Private_Association[i] = new aws.ec2.RouteTableAssociation(`${parameters.Project_Name}-RT-PRIV-${i}`,
            {
                routeTableId: Private_RT.id,
                subnetId: Private_Subnet[i].id,
                tags: {
                    Name: `${parameters.Project_Name}-RT-PRIV-ASS-${i}`
                },
            }
        );
    }

    const ASS_S3_Endpoint = new aws.ec2.VpcEndpointRouteTableAssociation(`${parameters.Project_Name}-ASSEnpointS3`, {
        routeTableId: Private_RT.id,
        vpcEndpointId: InfoS3Endpoint.id,
    });

    //////////////////////////////
    ////  Outputs Function

    let Information_Private_Networking = {
        Private_Subnets: Private_Subnet.map(function (e) {
            return e.id
        })
    }
    return Information_Private_Networking;
}
// Outputs
exports.Create_Public_Networking = public_networking;
exports.Private_Networking = private_networking;






// Route53 Domain Creation

