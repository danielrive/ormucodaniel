"use strict";
const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");
const awsx = require("@pulumi/awsx");

//////////////////////////
//// Create Route53 Record 

function Create_Route53_Record(parameters_R53) {

    const Route53zone = pulumi.output(aws.route53.getZone({
        name: parameters_R53.Domain,
        privateZone: false,
    }));

    const Route53_Record = new aws.route53.Record(`Record-${parameters_R53.Subdomain}-${parameters_R53.RootDomain}`, {
        name: parameters_R53.Subdomain,
        records: [parameters_R53.RecordValue],
        ttl: parameters_R53.TTL,
        type: parameters_R53.TypeRecord,
        zoneId: Route53zone.id,
    });

}

exports.Create_Route53_Record = Create_Route53_Record