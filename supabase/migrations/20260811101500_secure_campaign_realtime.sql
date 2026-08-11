-- BielJuliaRPG: authorize private Realtime Presence/Broadcast per campaign.
-- Topics use the form campaign:<campaign_uuid>.

DROP POLICY IF EXISTS "campaign members can receive realtime" ON realtime.messages;
CREATE POLICY "campaign members can receive realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.messages.extension IN ('presence', 'broadcast')
  AND EXISTS (
    SELECT 1
    FROM public.campaign_members cm
    WHERE cm.user_id = (SELECT auth.uid())
      AND (SELECT realtime.topic()) = ('campaign:' || cm.campaign_id::text)
  )
);

DROP POLICY IF EXISTS "campaign members can send realtime" ON realtime.messages;
CREATE POLICY "campaign members can send realtime"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.messages.extension IN ('presence', 'broadcast')
  AND EXISTS (
    SELECT 1
    FROM public.campaign_members cm
    WHERE cm.user_id = (SELECT auth.uid())
      AND (SELECT realtime.topic()) = ('campaign:' || cm.campaign_id::text)
  )
);
