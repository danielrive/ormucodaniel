# This project deploys a web application in AWS Cloud through Ansible playbooks and Pulumi.

================== The project is structured in two folders:

  *  **infrastructure**: This folder contains the JavaScript files whose responsibility is to create the infrastructure in AWS usign Pulumi,Pulumi is a tool to deploy resources in the cloud using programming languages like Node.js, Python or Go. In this case Pulumi will be used to deploy the necessary infrastructure to support the web application, the entire pulumi configuration will be done through ansible. the application use Auto Scaling Groups, when a new machine is deployed, an Ansible playbook is executed in the local host to configure the server to support the application.

Pulumi needs a machine to run the scripts to deploy the infrastructure, in this case i used Ansible to deploy an EC2 instance which will be used like management node, all configuration in this machine is made through Ansible playbooks.

The management node will have the responsability to deploy the scripts made in Pulumi with the necessary configuration to run the application. This node run pulumi commands to deploy the following resources:

**-** VPC 

**-** Internet Gateway

**-** Public Subnets and Route Tables

**-** ACLS

**-** Application Load Balancer with listener with https

**-** Auto Scaling Group with EC2 instances



