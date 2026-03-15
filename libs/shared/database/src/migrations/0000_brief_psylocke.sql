CREATE TYPE "public"."audit_operation" AS ENUM('INSERT', 'UPDATE', 'DELETE');--> statement-breakpoint
CREATE TYPE "public"."batch_status" AS ENUM('PLANNED', 'ACTIVE', 'HARVESTING', 'COMPLETED', 'DESTROYED', 'ON_HOLD');--> statement-breakpoint
CREATE TYPE "public"."compliance_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."growth_stage" AS ENUM('SEED', 'GERMINATION', 'CLONING', 'VEGETATIVE', 'MOTHER_PLANT', 'FLOWERING', 'HARVESTING', 'HARVESTED', 'DESTROYED');--> statement-breakpoint
CREATE TYPE "public"."plant_operation_type" AS ENUM('stage_change', 'transplant', 'pruning', 'watering', 'fertilizing', 'health_check', 'pest_treatment', 'harvest', 'destruction', 'observation');--> statement-breakpoint
CREATE TYPE "public"."quality_grade" AS ENUM('AAA', 'AA', 'A', 'B', 'C', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."system_role" AS ENUM('SUPER_ADMIN', 'QUALITY_MANAGER', 'CULTIVATION_MANAGER', 'OPERATOR', 'AUDITOR', 'READONLY');--> statement-breakpoint
CREATE TYPE "public"."zone_type" AS ENUM('seedling', 'germination', 'vegetation', 'flowering', 'mother_room', 'clone_room', 'drying', 'curing', 'storage', 'processing', 'quarantine');--> statement-breakpoint
CREATE TABLE "audit_trail" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_name" varchar(100) NOT NULL,
	"record_id" varchar(100) NOT NULL,
	"operation" "audit_operation" NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"session_id" varchar(100) NOT NULL,
	"ip_address" "inet" NOT NULL,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_number" varchar(50) NOT NULL,
	"parent_batch_id" uuid,
	"strain_id" uuid NOT NULL,
	"status" "batch_status" DEFAULT 'PLANNED' NOT NULL,
	"compliance_status" "compliance_status" DEFAULT 'pending' NOT NULL,
	"facility_id" uuid NOT NULL,
	"zone_id" uuid,
	"planned_plant_count" integer NOT NULL,
	"actual_plant_count" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"metadata" jsonb,
	"planned_start_date" timestamp with time zone,
	"actual_start_date" timestamp with time zone,
	"planned_harvest_date" timestamp with time zone,
	"actual_harvest_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid
);
--> statement-breakpoint
CREATE TABLE "facilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_code" varchar(10) NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" text NOT NULL,
	"coordinates" jsonb,
	"dimensions" jsonb,
	"license_number" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "harvest_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"plant_id" uuid,
	"fresh_weight_g" numeric(10, 3) NOT NULL,
	"dry_weight_g" numeric(10, 3),
	"quality_grade" "quality_grade",
	"lab_test_batch_id" varchar(100),
	"thc_percentage" numeric(5, 2),
	"cbd_percentage" numeric(5, 2),
	"harvested_by" uuid NOT NULL,
	"harvested_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"harvest_signature" jsonb NOT NULL,
	"qc_release_signature" jsonb,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plant_operations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plant_id" uuid NOT NULL,
	"operation_type" "plant_operation_type" NOT NULL,
	"operation_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"performed_by" uuid NOT NULL,
	"performed_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"authorized_by" uuid,
	"authorized_at" timestamp with time zone,
	"authorization_signature" jsonb,
	"qa_reviewed_by" uuid,
	"qa_reviewed_at" timestamp with time zone,
	"qa_signature" jsonb,
	"labour_cost" numeric(10, 2),
	"material_cost" numeric(10, 2),
	"equipment_cost" numeric(10, 2),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plant_code" varchar(20) NOT NULL,
	"batch_id" uuid NOT NULL,
	"strain_id" uuid NOT NULL,
	"current_stage" "growth_stage" DEFAULT 'SEED' NOT NULL,
	"facility_id" uuid NOT NULL,
	"room_id" uuid,
	"zone_id" uuid,
	"current_health_score" integer DEFAULT 100,
	"coordinates" jsonb,
	"notes" text,
	"metadata" jsonb,
	"last_stage_change_at" timestamp with time zone,
	"last_operation_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid NOT NULL,
	"room_code" varchar(30) NOT NULL,
	"name" varchar(100) NOT NULL,
	"dimensions" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stage_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plant_id" uuid NOT NULL,
	"from_stage" "growth_stage" NOT NULL,
	"to_stage" "growth_stage" NOT NULL,
	"transitioned_by" uuid NOT NULL,
	"authorized_by" uuid,
	"authorized_at" timestamp with time zone,
	"electronic_signature" jsonb,
	"authorization_signature" jsonb,
	"notes" text,
	"transitioned_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" text,
	"genetics" varchar(255),
	"thc_percentage_min" numeric(5, 2),
	"thc_percentage_max" numeric(5, 2),
	"cbd_percentage_min" numeric(5, 2),
	"cbd_percentage_max" numeric(5, 2),
	"flowering_time_days_min" integer,
	"flowering_time_days_max" integer,
	"expected_yield_g_per_plant" numeric(8, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"keycloak_id" varchar(36) NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(100) NOT NULL,
	"first_name" varchar(100) DEFAULT '' NOT NULL,
	"last_name" varchar(100) DEFAULT '' NOT NULL,
	"role" "system_role" DEFAULT 'READONLY' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"failed_login_count" integer DEFAULT 0 NOT NULL,
	"last_login_at" timestamp with time zone,
	"auditor_certification" varchar(255),
	"auditor_agency" varchar(255),
	"temporary_access_expires" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"zone_code" varchar(20) NOT NULL,
	"zone_type" "zone_type" NOT NULL,
	"name" varchar(100) NOT NULL,
	"area_m2" numeric(8, 2),
	"environment_config" jsonb,
	"coordinates" jsonb,
	"max_plants" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_strain_id_strains_id_fk" FOREIGN KEY ("strain_id") REFERENCES "public"."strains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "harvest_records" ADD CONSTRAINT "harvest_records_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "harvest_records" ADD CONSTRAINT "harvest_records_plant_id_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."plants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plant_operations" ADD CONSTRAINT "plant_operations_plant_id_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."plants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plant_operations" ADD CONSTRAINT "plant_operations_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plant_operations" ADD CONSTRAINT "plant_operations_authorized_by_users_id_fk" FOREIGN KEY ("authorized_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plant_operations" ADD CONSTRAINT "plant_operations_qa_reviewed_by_users_id_fk" FOREIGN KEY ("qa_reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plants" ADD CONSTRAINT "plants_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plants" ADD CONSTRAINT "plants_strain_id_strains_id_fk" FOREIGN KEY ("strain_id") REFERENCES "public"."strains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plants" ADD CONSTRAINT "plants_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plants" ADD CONSTRAINT "plants_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plants" ADD CONSTRAINT "plants_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_records" ADD CONSTRAINT "stage_records_plant_id_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."plants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_records" ADD CONSTRAINT "stage_records_authorized_by_users_id_fk" FOREIGN KEY ("authorized_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zones" ADD CONSTRAINT "zones_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_trail_table_record_idx" ON "audit_trail" USING btree ("table_name","record_id");--> statement-breakpoint
CREATE INDEX "audit_trail_changed_by_idx" ON "audit_trail" USING btree ("changed_by");--> statement-breakpoint
CREATE INDEX "audit_trail_changed_at_idx" ON "audit_trail" USING btree ("changed_at");--> statement-breakpoint
CREATE INDEX "audit_trail_operation_idx" ON "audit_trail" USING btree ("operation");--> statement-breakpoint
CREATE UNIQUE INDEX "batches_batch_number_idx" ON "batches" USING btree ("batch_number");--> statement-breakpoint
CREATE INDEX "batches_strain_idx" ON "batches" USING btree ("strain_id");--> statement-breakpoint
CREATE INDEX "batches_status_idx" ON "batches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "batches_facility_idx" ON "batches" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "batches_compliance_idx" ON "batches" USING btree ("compliance_status");--> statement-breakpoint
CREATE INDEX "batches_parent_idx" ON "batches" USING btree ("parent_batch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "facilities_code_idx" ON "facilities" USING btree ("facility_code");--> statement-breakpoint
CREATE INDEX "harvest_records_batch_idx" ON "harvest_records" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "harvest_records_plant_idx" ON "harvest_records" USING btree ("plant_id");--> statement-breakpoint
CREATE INDEX "harvest_records_harvested_at_idx" ON "harvest_records" USING btree ("harvested_at");--> statement-breakpoint
CREATE INDEX "harvest_records_grade_idx" ON "harvest_records" USING btree ("quality_grade");--> statement-breakpoint
CREATE INDEX "plant_operations_plant_idx" ON "plant_operations" USING btree ("plant_id");--> statement-breakpoint
CREATE INDEX "plant_operations_type_idx" ON "plant_operations" USING btree ("operation_type");--> statement-breakpoint
CREATE INDEX "plant_operations_performed_at_idx" ON "plant_operations" USING btree ("performed_at");--> statement-breakpoint
CREATE INDEX "plant_operations_performed_by_idx" ON "plant_operations" USING btree ("performed_by");--> statement-breakpoint
CREATE INDEX "plant_operations_authorized_by_idx" ON "plant_operations" USING btree ("authorized_by");--> statement-breakpoint
CREATE INDEX "plant_operations_qa_reviewed_by_idx" ON "plant_operations" USING btree ("qa_reviewed_by");--> statement-breakpoint
CREATE UNIQUE INDEX "plants_code_idx" ON "plants" USING btree ("plant_code");--> statement-breakpoint
CREATE INDEX "plants_batch_idx" ON "plants" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "plants_strain_idx" ON "plants" USING btree ("strain_id");--> statement-breakpoint
CREATE INDEX "plants_stage_idx" ON "plants" USING btree ("current_stage");--> statement-breakpoint
CREATE INDEX "plants_facility_zone_idx" ON "plants" USING btree ("facility_id","zone_id");--> statement-breakpoint
CREATE INDEX "plants_health_idx" ON "plants" USING btree ("current_health_score");--> statement-breakpoint
CREATE UNIQUE INDEX "rooms_facility_code_idx" ON "rooms" USING btree ("facility_id","room_code");--> statement-breakpoint
CREATE INDEX "rooms_facility_idx" ON "rooms" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "stage_records_plant_idx" ON "stage_records" USING btree ("plant_id");--> statement-breakpoint
CREATE INDEX "stage_records_transitioned_at_idx" ON "stage_records" USING btree ("transitioned_at");--> statement-breakpoint
CREATE INDEX "stage_records_authorized_by_idx" ON "stage_records" USING btree ("authorized_by");--> statement-breakpoint
CREATE UNIQUE INDEX "strains_code_idx" ON "strains" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "users_keycloak_id_idx" ON "users" USING btree ("keycloak_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "zones_room_code_idx" ON "zones" USING btree ("room_id","zone_code");--> statement-breakpoint
CREATE INDEX "zones_room_idx" ON "zones" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "zones_type_idx" ON "zones" USING btree ("zone_type");