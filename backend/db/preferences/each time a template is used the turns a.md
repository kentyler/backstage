# Template Instance and Topic Tracking

Each time a template is used, the turns associated with it should be tagged as belonging to a specific instance, so that the next time the template is used it will have its own set of turns and its own transcript.

In the updated database structure:

1. The `grp_con_avatar_turns` table has two additional columns:
   - `template_instance_id`: Links a turn to a specific template instance
   - `template_topic_id`: Links a turn to a specific topic from a template

2. This approach simplifies the database by:
   - Making `grp_con_avatar_turns` the single source of truth for all conversation turns
   - Eliminating the need for separate `grp_con_template_turns` and `grp_con_template_instance_turns` tables
   - Allowing turns to be optionally associated with template instances and topics