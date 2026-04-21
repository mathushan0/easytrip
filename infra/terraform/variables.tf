variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "eu-west-1"
}

variable "environment" {
  description = "Environment name (staging | production)"
  type        = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be 'staging' or 'production'."
  }
}

variable "app_name" {
  description = "Application name used for resource naming"
  type        = string
  default     = "easytrip"
}

variable "api_image" {
  description = "ECR image URI for the API service"
  type        = string
  default     = "placeholder/easytrip-api:latest"
}

variable "social_agent_image" {
  description = "ECR image URI for the social agent service"
  type        = string
  default     = "placeholder/easytrip-social-agent:latest"
}

variable "api_task_cpu" {
  description = "ECS task CPU units for API (512 = 0.5 vCPU)"
  type        = number
  default     = 512
}

variable "api_task_memory" {
  description = "ECS task memory for API in MB"
  type        = number
  default     = 1024
}

variable "api_desired_count" {
  description = "Desired number of API ECS tasks"
  type        = number
  default     = 2
}

variable "social_agent_task_cpu" {
  description = "ECS task CPU units for social agent"
  type        = number
  default     = 1024
}

variable "social_agent_task_memory" {
  description = "ECS task memory for social agent in MB"
  type        = number
  default     = 2048
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.medium"
}

variable "db_allocated_storage" {
  description = "RDS initial storage in GB"
  type        = number
  default     = 100
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "easytrip"
}

variable "db_username" {
  description = "PostgreSQL master username"
  type        = string
  default     = "easytrip_admin"
  sensitive   = true
}

variable "db_password" {
  description = "PostgreSQL master password (store in AWS Secrets Manager, not here)"
  type        = string
  sensitive   = true
}

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.r7g.large"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones to use"
  type        = list(string)
  default     = ["eu-west-1a", "eu-west-1b"]
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS (must already exist in us-east-1 for CloudFront, eu-west-1 for ALB)"
  type        = string
}

variable "tags" {
  description = "Common tags applied to all resources"
  type        = map(string)
  default = {
    Project     = "EasyTrip"
    ManagedBy   = "Terraform"
    Owner       = "DevOps"
  }
}
