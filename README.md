# This project deploys a web application in AWS Cloud through Ansible playbooks and Pulumi.

================== 

The project is structured in two folders:

  *  **infrastructure**: This folder contains the JavaScript files whose responsibility is to create the infrastructure in AWS usign Pulumi,Pulumi is a tool to deploy resources in the cloud using programming languages like Node.js, Python or Go. In this case Pulumi will be used to deploy the necessary infrastructure to support the web application, the entire pulumi configuration will be done through ansible. the application use Auto Scaling Groups, when a new machine is deployed, an Ansible playbook is executed in the local host to configure the server to support the application.
  
     Pulumi needs a machine to run the scripts to deploy the infrastructure, in this case i used Ansible to deploy an EC2 instance  which will be used like management node, all configuration in this machine is made through Ansible playbooks.
     The management node will have the responsability to deploy the scripts made in Pulumi with the necessary configuration to run the  application. This node run pulumi commands to deploy the following resources:

      **-** VPC 

      **-** Internet Gateway

      **-** Public Subnets and Route Tables

      **-** Network ACLs and Security Groups

      **-** Application Load Balancer with listener with https

      **-** Auto Scaling Group with EC2 instances
      
      The auto-scaling group uses cloud-init to run ansible command that autoconfigure each instance through Ansible Playbook , please view the ASG.js script in the /infrastructure/script route.
      **I used Pulumi because is a good tool to apply IaC, Pulumi saves the state of the infrastructure in Pulumi Web and can be used with AWS, AZURE, OpenStack, Docker and Kubernetes.**

   *  **Playbooks**: This folder contains the Ansible Playbooks used to deploy and configure the web application.
      Ansible use three roles to deploy all application.
      
         * **aws_resources role**:This role has the responsibility to deploy the management node(EC2 instance) that will run pulumi to deploy the infrastructure. The AWS resources like VPC and subnets already exist in my AWS account, but also can be deployed with Ansible but to make more fastly the deploy, I specified the resources already created.
         * **aws_application role**: This role has the responsibility to configure the management node(EC2 instance) created by aws_resources role, the playbook installs node.js, create folders,ssh keys and tokens necessaries to run Pulumi. When Pulumi has been configured, the ansible task run pulumi to deploy the AWS resources.
         * **server_resources role** This role has the responsibility to configure the EC2 instances deployed by auto-scaling group, configure the instance and run the application. if a new instance is launched by an auto-scaling event will be auto-configured by Ansible and Cloud-Init.
           
