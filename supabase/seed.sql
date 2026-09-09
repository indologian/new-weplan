-- Set real prices before production.
insert into public.tiers
(code, name, price, active_months, max_gallery_images, max_youtube_videos)
values
('basic','Basic',0,3,4,0),
('premium','Premium',0,6,6,1),
('vip','VIP',0,12,10,2)
on conflict (code) do nothing;

insert into public.homepage_sections(section_key,section_name,is_visible,sort_order)
values
('hero','Hero',true,10),
('social-proof','Social Proof',true,20),
('themes','Themes',true,30),
('lead-magnet','Lead Magnet',true,40),
('faq','FAQ',true,50),
('footer','Footer',true,60)
on conflict (section_key) do nothing;

