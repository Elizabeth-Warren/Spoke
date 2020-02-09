#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")"

./psql.sh -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public'
./redis-cli.sh flushdb
yarn run dev-migrate

# Owner: spoke@example.com / password "spoke"
# Admin: spoke-admin@example.com / password "spoke-admin"
# Texter: spoke-texter@example.com / password "spoke-texter"
SEED_SQL=$(cat <<-END
INSERT INTO "public"."user"("id","auth0_id","first_name","last_name","cell","email","created_at","assigned_cell","is_superadmin","terms")
VALUES
(1,E'localauth|86a25acc0da942093b9052aecef27c79a8e393c0ae404dde1bb5cda1b0e585e4|b8c74ad28bee3ee0a075ebcb503d98d886443be4c9b3cc16d2b4d03a4c1602f235384d995d05fecd982d497c0f26a5741e27806073b3a7573a39aa7b0abb5cc7989ccc1b49cedd7d49df58a3651ca62fc9aa0a1702d0671a5a4bb79481577e47d90a15af691bfbfb30f2ea403273368b0627010e1346a0ea2225287505270ddd9dd9c19c3663fa603feebdaf5bc70b6c7a1727547a75496afad283f6de8ddd2f4842393645dc2fee6804165dba673c8440c74e10fc8f9c1892ceeba87d7ba23946fc5de5d787054f4d09c05a5f8228e90195977d6f70aee0a308690d6656cfeca3ff30660d4d741e2654bd5ed25681446a5b829f413c12ff83b01f8a5d3eba8fb5a678564b7cba11f45396af56a32d6835fe4e3581a618ade7650803e237b34643a080e245b9d2ef5b6cc96a3352201c4d601913af3cceec55722e23b824b2631e3b43e9c983104c4c626f08ddf59d2721c6e2ce32e36eecf1b14d90a80a4a330333f1f056478dd89397f3bee04b07cf324ede6228716b009c8f6936344f61bb5f9683b7ab4d3f9c59e5a846b5c8ee85a7297ebb4537e2620a273ef8a504bd8c8d0f06b4965bccf9aab9352336a77d22d4f7f5e63141282020c502e49abaaa3c5bec3196ddfc0309958af0dab3d68921d19ed637646e4ceead4a5ec6c0ea5447066590c74834e1361b85a0e436c03ec8109cc0c6fb158a3dd35d129a45cfeeab',E'Spoker',E'Of The House',NULL,E'spoke@example.com',E'2020-02-09 20:56:20.929094+00',NULL,FALSE,FALSE),
(2,E'localauth|c5671a523e17d7b14a5426c79bb1ee9c43ad73b3112842bbadbbfb0ed9174c5b|25e7fc98e080b00e61f1286add14d5916e4dba50aee38e242e27a4b139bdcc8f4d6bdab04d2099ed2289dc176cddacd1fe49988e642e509167956430483de3e2a094d7fab728b132d959a0f662dedd955e91e9c147bea9daaf3b96b0d813909a2da5af74292fb519018bdcc0beb3e832182fdd8b4312d1e711a920611de9c06c673b25869581d23dbe36a59f9a310bedd8dc108b9e3b0173a28216b1f87860cf66b8af295aa077e2c0a0627ae439c46c75f5d6d54fbc69ea346eee322d21b7a1b7d26a9ad1e1a17473da4291d584c770f5bbbe08cbd7acc0bbe4caf57f17871ca84bed0937a38a6639fe00ae05dc360bf201a3e13f3db4ba2a8e23ce1878ffa556ca88a0728e83ae61d8e6a223d7707b1f9d1edba449771bb70d5c4fc3710ba8d3ba23625a9ac9a72d8f8215fc75f9a07d9c57de04ebb293aabf28b3a3a3729693843455e31ba362872279a2de95a58a912c055d33b3f358161927fec40754df0426653c4e28187ca7def2e81d803d6a7250c4ea0cf03a44df24cdfaf1a6da0d492b048624668a2035b9ea8b56eba4703a057328c31524b5d54605cd7701da42d42017b45b329c174f25ce816dcc2af25a92d6e4a621817fdaaa7dcd75a028fb0693b8436139a6902408222443c60bc1d9f5bd5ebed83daafd88880c860399c2c048d4a24532ca970440e0e5b4a4300f44ada95b0ea99ff82497709cebc6f718',E'Admin',E'McAdmin',NULL,E'spoke-admin@example.com',E'2020-02-09 21:06:54.632161+00',NULL,FALSE,FALSE),
(3,E'localauth|c3b5d4dfcea7de5865ab699d2e9a2510dd03b0244fe976543e945b912675f0e5|4fb82312212433b35d1f4e0451eb415830117e8d6f69f497c65e50f3e55b727737bee1566586af41f59d4102ff157c4e300af04f62024ce61c4371de890a687ff0c4f1e790645854fa7419b7eeb580cb039b0168470a292bc1be3a27707a496709de8dd61062aced1dc97ad2fd981e19e8a0364ca2ac6023f9995f8c3c802af45c1833687a964a0c7da0f83261002260f96850477314373bbdcd4e612b0b9adb94b4cb4dc69f2e4c32f0d5add97e8dc973f3b3a2e919e02219f195d7d21f769ab1dd449cb93f590fd42eb34200873d9541438b263392ce46780a746de5b397995edcbe66ed3b3bf3476edde94685745320d74d83e95b5e47a93ec3ecc8a2a89bb70b97a1d77643e154229530bd449d149f534c08a06735e140fd127f726e5f755a31cd74252f39e965d48e54675bfebf0c6fc2cbd71f88f586a5f56e378c9e8152ae1bcfd863115ab8d2760d122a378647478e2d0b79d5ae9991a30cd66c68327fb529d1bd57e506ffc7be85974966c65863fcb37d2d25e03d7d0d8db68da3a8cb171b8dda58e9258e72bf57c5961621f59d98dc195513ddf18048b7808abfdaa3e4367448e3fa1772dfbf3c892ba9ab7d2b2b6e666cc1a60a9bb4fbff73afe962601a4ec77f3c2100f6e1acf893ccfee2a5b5b531c2aeab7c40809563f911b86d8b6c5d376e1de9d40752a590930dd3b6d4840d51bc411b3ebf705e06f1c284',E'Texter',E'McTexter',NULL,E'spoke-texter@example.com',E'2020-02-09 21:07:18.442551+00',NULL,FALSE,FALSE);
ALTER SEQUENCE user_id_seq RESTART WITH 4;

INSERT INTO "public"."organization"("id","uuid","name","created_at","features","texting_hours_enforced","texting_hours_start","texting_hours_end")
VALUES
(1,E'9a6c3085-221f-4c43-ab39-32d9d9f7ef2d',E'Spoke Dev',E'2020-02-09 20:56:24.29914+00',E'',FALSE,9,21),
(2,E'fb02ef46-a7d5-4137-a63c-84cbfd10ad1a',E'Second Org',E'2020-02-09 21:16:30.545444+00',E'',FALSE,9,21);
ALTER SEQUENCE organization_id_seq RESTART WITH 2;

INSERT INTO "public"."user_organization"("id","user_id","organization_id","role")
VALUES
(1,1,1,E'OWNER'),
(2,2,1,E'ADMIN'),
(3,3,1,E'TEXTER'),
(4,1,2,E'OWNER');
ALTER SEQUENCE user_organization_id_seq RESTART WITH 5;


END
)

./psql.sh -c "$SEED_SQL"
