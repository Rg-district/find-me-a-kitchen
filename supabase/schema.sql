-- Find Me a Kitchen — Supabase Schema
-- Run in Supabase SQL Editor (supabase.com → your project → SQL Editor)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- KITCHENS table
CREATE TABLE IF NOT EXISTS kitchens (
  id                 text PRIMARY KEY,
  name               text NOT NULL,
  city               text NOT NULL,
  area               text NOT NULL,
  postcode           text NOT NULL,
  type               text[] NOT NULL DEFAULT '{}',
  price_per_hour     integer NOT NULL DEFAULT 0,
  price_per_month    integer,
  min_hours          integer NOT NULL DEFAULT 0,
  max_capacity       integer NOT NULL DEFAULT 1,
  equipment          text[] NOT NULL DEFAULT '{}',
  certifications     text[] NOT NULL DEFAULT '{}',
  operating_hours    text NOT NULL DEFAULT '',
  available_shifts   text[] NOT NULL DEFAULT '{}',
  storage            text[] NOT NULL DEFAULT '{}',
  delivery_platforms text[] NOT NULL DEFAULT '{}',
  food_types         text[] NOT NULL DEFAULT '{}',
  website            text NOT NULL DEFAULT '',
  phone              text NOT NULL DEFAULT '',
  email              text NOT NULL DEFAULT '',
  description        text NOT NULL DEFAULT '',
  features           text[] NOT NULL DEFAULT '{}',
  rating             numeric(3,1) NOT NULL DEFAULT 0,
  review_count       integer NOT NULL DEFAULT 0,
  verified           boolean NOT NULL DEFAULT false,
  listing_active     boolean NOT NULL DEFAULT true,
  created_at         timestamptz DEFAULT now()
);

-- ENQUIRIES table
CREATE TABLE IF NOT EXISTS enquiries (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at  timestamptz DEFAULT now(),
  kitchen_id  text REFERENCES kitchens(id),
  name        text NOT NULL,
  email       text NOT NULL,
  phone       text,
  message     text,
  status      text NOT NULL DEFAULT 'new'
);

-- SEARCHES table (analytics)
CREATE TABLE IF NOT EXISTS searches (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at   timestamptz DEFAULT now(),
  city         text,
  budget_type  text,
  budget       integer,
  team_size    integer,
  results_count integer
);

-- RLS
ALTER TABLE kitchens ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE searches ENABLE ROW LEVEL SECURITY;

-- Public can view active kitchens (no contact info needed — API strips it)
CREATE POLICY "Public view active kitchens" ON kitchens FOR SELECT USING (listing_active = true);

-- Service role full access
CREATE POLICY "Service role kitchens"   ON kitchens   FOR ALL TO service_role USING (true);
CREATE POLICY "Service role enquiries"  ON enquiries  FOR ALL TO service_role USING (true);
CREATE POLICY "Service role searches"   ON searches   FOR ALL TO service_role USING (true);

-- SEED DATA
INSERT INTO kitchens (id,name,city,area,postcode,type,price_per_hour,price_per_month,min_hours,max_capacity,equipment,certifications,operating_hours,available_shifts,storage,delivery_platforms,food_types,website,phone,email,description,features,rating,review_count,verified) VALUES
('k001','Karma Kitchen Bermondsey','London','Bermondsey','SE1',ARRAY['dark','ghost'],0,1500,0,8,ARRAY['commercial oven','industrial fryer','griddle','cold room','blast chiller','pizza oven'],ARRAY['5-star hygiene','Gas Safe','Fire Safety'],'24/7',ARRAY['morning','afternoon','evening','overnight','24hr'],ARRAY['dry','cold','frozen'],ARRAY['Deliveroo','UberEats','JustEat'],ARRAY['hot meals','pizza','burgers','Asian','Mediterranean'],'karma.kitchen','020 7123 4567','bermondsey@karma.kitchen','Professional ghost kitchen space in the heart of Bermondsey. Purpose-built for delivery brands with direct platform integrations.',ARRAY['24/7 access','delivery platform integration','CCTV','loading bay','staff lockers'],4.8,94,true),
('k002','Karma Kitchen Waterloo','London','Waterloo','SE1',ARRAY['dark','ghost'],0,1800,0,10,ARRAY['commercial oven','industrial fryer','griddle','cold room','blast chiller','wok range'],ARRAY['5-star hygiene','Gas Safe','Fire Safety'],'24/7',ARRAY['morning','afternoon','evening','overnight','24hr'],ARRAY['dry','cold','frozen'],ARRAY['Deliveroo','UberEats','JustEat'],ARRAY['hot meals','Asian','Mediterranean','burgers'],'karma.kitchen','020 7123 4568','waterloo@karma.kitchen','Landmark ghost kitchen near Waterloo station. Excellent transport links and dedicated delivery bay.',ARRAY['24/7 access','delivery platform integration','CCTV','loading bay','bike storage'],4.7,67,true),
('k003','Mission Kitchen White City','London','White City','W12',ARRAY['shared','incubator'],25,null,3,4,ARRAY['commercial oven','stand mixer','food processor','cold room','combi oven'],ARRAY['5-star hygiene','Organic certified'],'Mon-Fri 6am-10pm Sat 8am-8pm',ARRAY['morning','afternoon','evening'],ARRAY['dry','cold'],ARRAY['Own fleet'],ARRAY['bakery','pastry','health food','snacks'],'missionkitchen.co.uk','020 8743 1234','hello@missionkitchen.co.uk','Incubator kitchen for food entrepreneurs. Community-focused with business support and mentorship available.',ARRAY['storage lockers','communal prep area','networking events','business support','photography studio'],4.9,43,true),
('k004','Docklands Kitchen Hub','London','Canary Wharf','E14',ARRAY['shared','private'],30,2200,2,6,ARRAY['commercial oven','industrial fryer','griddle','cold room','wok range','salamander'],ARRAY['5-star hygiene','Gas Safe','Halal certified','Kosher certified'],'Mon-Sun 6am-midnight',ARRAY['morning','afternoon','evening'],ARRAY['dry','cold','frozen'],ARRAY['Deliveroo','UberEats','JustEat','Own fleet'],ARRAY['hot meals','Asian','Middle Eastern','burgers','pizza'],'docklandskitchenhub.co.uk','020 7987 6543','bookings@docklandskitchenhub.co.uk','Premium kitchen space in Canary Wharf with Halal and Kosher certification. Corporate catering specialists.',ARRAY['corporate catering contracts','CCTV','loading dock','staff canteen','private meeting room'],4.6,28,true),
('k005','East End Food Hub','London','Hackney','E8',ARRAY['shared','dark'],20,1200,2,5,ARRAY['commercial oven','griddle','cold room','blast chiller','combi oven'],ARRAY['5-star hygiene','Organic certified'],'Mon-Sat 7am-11pm',ARRAY['morning','afternoon','evening'],ARRAY['dry','cold','frozen'],ARRAY['Deliveroo','UberEats'],ARRAY['health food','vegan','organic','street food'],'eastendfoodhub.co.uk','020 8923 4567','hello@eastendfoodhub.co.uk','Community-focused kitchen hub in Hackney supporting independent food businesses and social enterprises.',ARRAY['affordable rates','community events','storage included','flexible terms','mentorship programme'],4.5,56,false),
('k006','Notting Hill Kitchen Studios','London','Notting Hill','W11',ARRAY['private','shared'],45,3500,2,8,ARRAY['commercial oven','stand mixer','food processor','cold room','blast chiller','combi oven','pasta machine'],ARRAY['5-star hygiene','Organic certified','Gluten-free certified'],'Mon-Fri 7am-10pm Sat-Sun 8am-8pm',ARRAY['morning','afternoon','evening'],ARRAY['dry','cold','frozen'],ARRAY['Own fleet'],ARRAY['bakery','patisserie','health food','premium catering','cooking classes'],'nothinghillkitchenstudios.com','020 7229 8765','studio@nhkitchenstudios.com','Boutique kitchen studios in the heart of Notting Hill. Perfect for premium food brands, cooking classes and content creation.',ARRAY['photography studio','filming space','props available','private hire','event hosting'],4.9,31,true),
('k007','Manchester Food Works','Manchester','Ancoats','M4',ARRAY['shared','dark'],18,1100,2,6,ARRAY['commercial oven','industrial fryer','griddle','cold room','blast chiller','wok range'],ARRAY['5-star hygiene','Gas Safe'],'Mon-Sun 6am-midnight',ARRAY['morning','afternoon','evening','overnight'],ARRAY['dry','cold','frozen'],ARRAY['Deliveroo','UberEats','JustEat'],ARRAY['hot meals','Asian','pizza','burgers','street food'],'manchesterfoodworks.co.uk','0161 234 5678','info@manchesterfoodworks.co.uk','Northern powerhouse kitchen in the heart of Ancoats. Ideal for delivery brands targeting the Manchester market.',ARRAY['24/7 access','delivery optimised','CCTV','loading area','flexible contracts'],4.6,48,true),
('k008','Northern Quarter Kitchen Co.','Manchester','Northern Quarter','M1',ARRAY['shared','incubator'],22,null,2,4,ARRAY['commercial oven','stand mixer','cold room','combi oven','food processor'],ARRAY['5-star hygiene','Organic certified'],'Mon-Sat 7am-10pm',ARRAY['morning','afternoon','evening'],ARRAY['dry','cold'],ARRAY['Own fleet'],ARRAY['bakery','street food','health food','snacks'],'nqkitchen.co.uk','0161 345 6789','hello@nqkitchen.co.uk','Independent kitchen collective in Manchester''s Northern Quarter. Community of food makers with shared values.',ARRAY['flexible booking','communal space','networking','farmers market links','pop-up support'],4.7,22,true),
('k009','Leeds Central Kitchen','Leeds','City Centre','LS1',ARRAY['shared','dark'],15,950,2,5,ARRAY['commercial oven','industrial fryer','griddle','cold room','blast chiller'],ARRAY['5-star hygiene','Gas Safe'],'Mon-Sun 6am-11pm',ARRAY['morning','afternoon','evening'],ARRAY['dry','cold','frozen'],ARRAY['Deliveroo','UberEats','JustEat'],ARRAY['hot meals','pizza','burgers','Asian','street food'],'leedscentralkitchen.co.uk','0113 246 8000','bookings@leedscentralkitchen.co.uk','Centrally located commercial kitchen in Leeds. Competitive rates and long-term contract discounts available.',ARRAY['competitive pricing','flexible contracts','CCTV','storage included','delivery zone access'],4.4,39,true),
('k010','Birmingham Food Factory','Birmingham','Digbeth','B5',ARRAY['shared','dark','ghost'],20,1300,2,7,ARRAY['commercial oven','industrial fryer','griddle','cold room','blast chiller','wok range','tandoor'],ARRAY['5-star hygiene','Gas Safe','Halal certified'],'24/7',ARRAY['morning','afternoon','evening','overnight','24hr'],ARRAY['dry','cold','frozen'],ARRAY['Deliveroo','UberEats','JustEat'],ARRAY['hot meals','Indian','Asian','pizza','burgers','Middle Eastern'],'birminghamfoodfactory.co.uk','0121 345 6789','info@birminghamfoodfactory.co.uk','Large-scale commercial kitchen in Digbeth with Halal certification. Ideal for scaling delivery operations.',ARRAY['24/7 access','Halal certified','CCTV','large loading area','bulk storage','staff facilities'],4.5,61,true),
('k011','Bristol Kitchen Collective','Bristol','Stokes Croft','BS1',ARRAY['shared','incubator'],20,null,2,4,ARRAY['commercial oven','stand mixer','cold room','combi oven','food processor','blast chiller'],ARRAY['5-star hygiene','Organic certified','Vegan certified'],'Mon-Sat 7am-10pm',ARRAY['morning','afternoon','evening'],ARRAY['dry','cold','frozen'],ARRAY['Own fleet'],ARRAY['vegan','organic','health food','bakery','street food'],'bristolkitchencollective.co.uk','0117 923 4567','hello@bristolkitchencollective.co.uk','Ethical food production kitchen in Stokes Croft. Focused on sustainable, plant-based and organic food businesses.',ARRAY['sustainable practices','vegan certified','community events','pop-up support','flexible terms'],4.8,27,true),
('k012','Edinburgh Food Studio','Edinburgh','Leith','EH6',ARRAY['private','shared'],25,1600,2,6,ARRAY['commercial oven','stand mixer','cold room','combi oven','food processor','blast chiller','smoker'],ARRAY['5-star hygiene','Organic certified'],'Mon-Sat 7am-9pm',ARRAY['morning','afternoon','evening'],ARRAY['dry','cold','frozen'],ARRAY['Own fleet'],ARRAY['Scottish cuisine','fine dining','bakery','health food','catering'],'edinburghfoodstudio.co.uk','0131 555 0100','studio@edinburghfoodstudio.co.uk','Premium food production studio in Leith, Edinburgh. Specialists in Scottish produce and fine dining production.',ARRAY['stunning photography space','Scottish produce suppliers','private dining room','event hosting','catering contracts'],4.8,19,true),
('k013','Shoreditch Ghost Kitchens','London','Shoreditch','E1',ARRAY['ghost','dark'],0,2000,0,12,ARRAY['commercial oven','industrial fryer','griddle','cold room','blast chiller','wok range','combi oven'],ARRAY['5-star hygiene','Gas Safe','Fire Safety'],'24/7',ARRAY['morning','afternoon','evening','overnight','24hr'],ARRAY['dry','cold','frozen'],ARRAY['Deliveroo','UberEats','JustEat','Own fleet'],ARRAY['hot meals','Asian','pizza','burgers','Mediterranean','Middle Eastern'],'shoreditchghostkitchens.com','020 7739 1234','ops@shoreditchghostkitchens.com','Purpose-built ghost kitchen facility in Shoreditch. Maximum delivery coverage across East and Central London.',ARRAY['24/7 staffed reception','dedicated delivery bays','branding support','tech integrations','expansion pathways'],4.7,82,true),
('k014','Glasgow Kitchen Hub','Glasgow','City Centre','G1',ARRAY['shared','dark'],16,1000,2,5,ARRAY['commercial oven','industrial fryer','griddle','cold room','blast chiller','wok range'],ARRAY['5-star hygiene','Gas Safe'],'Mon-Sun 6am-midnight',ARRAY['morning','afternoon','evening','overnight'],ARRAY['dry','cold','frozen'],ARRAY['Deliveroo','UberEats','JustEat'],ARRAY['hot meals','Asian','pizza','burgers','Scottish cuisine'],'glasgowkitchenhub.co.uk','0141 234 5678','info@glasgowkitchenhub.co.uk','Affordable commercial kitchen in Glasgow city centre. Great rates for new food businesses getting started.',ARRAY['affordable rates','flexible contracts','CCTV','storage','delivery zone access'],4.3,34,false),
('k015','Liverpool Street Food Lab','Liverpool','Baltic Triangle','L1',ARRAY['shared','incubator'],18,null,2,4,ARRAY['commercial oven','griddle','cold room','combi oven','food processor','smoker'],ARRAY['5-star hygiene','Fire Safety'],'Mon-Sat 7am-10pm',ARRAY['morning','afternoon','evening'],ARRAY['dry','cold'],ARRAY['Own fleet'],ARRAY['street food','fusion','BBQ','snacks','bakery'],'liverpoolstreetfoodlab.co.uk','0151 709 8765','hello@liverpoolstreetfoodlab.co.uk','Creative food lab in the heart of the Baltic Triangle. The go-to spot for Liverpool''s street food scene.',ARRAY['street food community','pop-up events','market links','flexible booking','social media support'],4.6,41,true);
