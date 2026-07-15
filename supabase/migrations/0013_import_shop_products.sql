-- ============================================================================
-- One-time import of the website's existing shop products into Supabase.
-- Run after 0012_shop_fields.sql. Safe to re-run (skips existing slugs).
-- Adjust stock quantities afterwards in the app (Products page).
-- ============================================================================

insert into products (name, slug, category, subcategory, short, description, tag, price, stock, active, images, specs)
values ('Strickland Spring Hitch Kubota 6t 45mm Pins', 'spring-hitch-6t-45mmpins', 'Digger Hitches', 'Spring Hitches', 'Strickland spring hitch for 4–6 ton Kubota excavators.', 'Strickland spring hitch for use with Kubota 4–6 ton excavators. The hitch is supplied with the bar to lever the jaw open and the safety pin.', 'New in', 996.3, 10, true, '["assets/Shop Media/Strickland-spring-hitch-45mm-pins-main.jpg"]'::jsonb, '[{"label":"Pin size","value":"45 mm"},{"label":"Dipper width","value":"145 mm"},{"label":"Bucket hitch gap","value":"145 mm"},{"label":"Pin centres","value":"245 mm"},{"label":"Lead time","value":"In stock"}]'::jsonb)
on conflict (slug) do nothing;

insert into products (name, slug, category, subcategory, short, description, tag, price, stock, active, images, specs)
values ('Strickland ZX210 Hydraulic Hitch 20t', 'hydraulic-hitch-zx210-20t', 'Digger Hitches', 'Hydraulic Hitches', 'Strickland hydraulic quick-hitch to suit 20 ton excavators.', 'Change attachments in seconds from the comfort of your cab—no downtime, no hassle. Built tough for 2.5 to 53-ton machines, the S-Lock delivers unmatched safety, simplicity, and strength on every job site.
The most compact 21 tonne coupler on the market. The Strickland 21T ‘S’ Lock coupler has the lowest coupler boss set to maximise the loss in break out force between the excavator and attachment. Simple and effective design has been the secret to its success, with only two moving parts, including a fully enclosed hydraulic cylinder. This coupler will work in the toughest environments.', 'New in', 2720, 10, true, '["assets/Shop Media/Strickland-ZX210-Hydraulic-hitch-MAIN-20T.jpg"]'::jsonb, '[{"label":"Fits machine","value":"Volvo EC210, Komatsu PC210, Hyundai 210"},{"label":"Type","value":"Hydraulic quick-hitch"},{"label":"Pin Size","value":"80mm"},{"label":"Dipper Width","value":"310-325mm"}]'::jsonb)
on conflict (slug) do nothing;

insert into products (name, slug, category, subcategory, short, description, tag, price, stock, active, images, specs)
values ('Strickland 20t 7ft XHD Grading Bucket', 'grading-bucket-20t-7ft-xhd', 'Digger Attachments', 'Grading Buckets', 'Extra heavy-duty 7ft grading bucket for 20t excavators.', 'Strickland 20 tonne 7ft XHD (extra heavy duty) grading bucket for batters, clean-up and finished grading. Price on application; get in touch for current pricing.', null, 0, 10, true, '["assets/Shop Media/Strickland-20t-7ft-XHD-grader-main.jpg"]'::jsonb, '[{"label":"Fits machine","value":"20 t excavators"},{"label":"Width","value":"7 ft (2.1 m)"},{"label":"Grade","value":"XHD — extra heavy duty"}]'::jsonb)
on conflict (slug) do nothing;

insert into products (name, slug, category, subcategory, short, description, tag, price, stock, active, images, specs)
values ('20t 5ft Digging Bucket with Teeth', 'digging-bucket-20t-5ft-teeth', 'Digger Attachments', 'Digging Buckets', '5ft toothed digging bucket for 20 ton excavators.', 'A 5ft digging bucket with bolt-on teeth for 20 tonne excavators — built for trenching and bulk dig. Price on application.', null, 0, 10, true, '["assets/Shop Media/20t-5ft-digging-bucket-with-teeth-1-1.jpg"]'::jsonb, '[{"label":"Fits machine","value":"20 t excavators"},{"label":"Width","value":"5 ft (1.5 m)"},{"label":"Teeth","value":"Bolt-on"}]'::jsonb)
on conflict (slug) do nothing;

insert into products (name, slug, category, subcategory, short, description, tag, price, stock, active, images, specs)
values ('Strickland 5 Ton 3D Bladed Gummy Bucket', 'gummy-bucket-5t-3d-bladed', 'Digger Attachments', 'Gummy Buckets', '5 ton 3D-bladed gummy (ditching) bucket.', 'Strickland 5 tonne 3D bladed gummy bucket — ideal for ditch cleaning and grading on softer ground. Price on application.', null, 0, 10, true, '["assets/Shop Media/strickland-5-ton-3d-bladed-gummyblade.jpg"]'::jsonb, '[{"label":"Fits machine","value":"5 t excavators"},{"label":"Edge","value":"3D bladed gummy"},{"label":"Use","value":"Ditching / grading"}]'::jsonb)
on conflict (slug) do nothing;

insert into products (name, slug, category, subcategory, short, description, tag, price, stock, active, images, specs)
values ('13t Floating Pallet Forks', 'floating-pallet-forks-13t', 'Digger Attachments', 'Pallet Forks', 'Floating pallet forks to suit 13 ton excavators.', 'Floating pallet forks for 13 tonne excavators — handle pallets and packs with a self-levelling action. Price on application.', null, 0, 10, true, '["assets/Shop Media/13t-BucketsIE-floating-pallet-forks-main.jpg"]'::jsonb, '[{"label":"Fits machine","value":"13 t excavators"},{"label":"Type","value":"Floating pallet forks"}]'::jsonb)
on conflict (slug) do nothing;

insert into products (name, slug, category, subcategory, short, description, tag, price, stock, active, images, specs)
values ('13t Riddle Bucket', 'riddle-bucket-13t', 'Digger Attachments', 'Riddle Buckets', 'Riddle / sorting bucket for 13 ton excavators.', 'A 13 tonne riddle bucket for separating stone, soil and rubble on site. Price on application.', null, 0, 10, true, '["assets/Shop Media/13t-riddle-bucket.jpg"]'::jsonb, '[{"label":"Fits machine","value":"13 t excavators"},{"label":"Type","value":"Riddle / sorting bucket"}]'::jsonb)
on conflict (slug) do nothing;

