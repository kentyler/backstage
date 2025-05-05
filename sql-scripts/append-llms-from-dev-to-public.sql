-- Simple SQL script to append all records from dev.llms to public.llms
-- This script assumes the public.llms table already exists with the correct structure
-- including a 'subdomain' column

-- Copy all records from dev.llms to public.llms
DO $$
DECLARE
    llm_record record;
    existing_id integer;
BEGIN
    -- For each record in dev.llms
    FOR llm_record IN
        SELECT * FROM dev.llms
    LOOP
        -- Check if this record already exists in public schema
        SELECT id INTO existing_id FROM public.llms WHERE id = llm_record.id;
        
        IF existing_id IS NULL THEN
            -- Insert the record into public schema with the subdomain set to 'dev'
            INSERT INTO public.llms (
                id, name, provider, model, api_key, temperature, max_tokens, 
                type_id, additional_config, subdomain, created_at, updated_at
            ) VALUES (
                llm_record.id, 
                llm_record.name, 
                llm_record.provider, 
                llm_record.model, 
                llm_record.api_key, 
                llm_record.temperature, 
                llm_record.max_tokens, 
                llm_record.type_id, 
                llm_record.additional_config, 
                'dev', -- Set the subdomain to 'dev'
                llm_record.created_at, 
                llm_record.updated_at
            );
                
            RAISE NOTICE 'Copied LLM % from dev schema to public schema with subdomain = dev', 
                llm_record.name;
        ELSE
            RAISE NOTICE 'LLM % already exists in public schema with ID %', 
                llm_record.name, existing_id;
        END IF;
    END LOOP;
END $$;

-- Done!
SELECT 'Append of llms from dev schema to public schema complete!' AS result;