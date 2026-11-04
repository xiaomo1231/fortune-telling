# 墨星牌 · 22 张大牌 AI 生图提示词

风格：苏联构成主义海报（1920 年代），以大色块和斜线构图为核心，人物用**写实的照片剪影**而不是几何小人。这正是 Lissitzky、Rodchenko、Klutsis、Stenberg 兄弟作品里人物的做法：真实的人体比例和姿态，用高反差黑白照片拼贴进几何色块里。

## 怎么用

1. 先用同一个基础提示词，只生成 **愚者、星星、太阳** 三张，挑出最满意的一张作为“风格参考图”。
2. 之后每张牌都带上这张参考图（Midjourney 用 `--sref 图片链接`，即梦、可灵、通义万相用“参考图 / 风格参考”功能），保证 22 张画风统一。
3. 生成时**不要让 AI 写字**，AI 写的字基本都会出错。牌名、编号统一后期用设计软件加：左上角黑色竖条写中文牌名，罗马数字放大嵌进色块。
4. 每张图生成后人工检查“必须出现的象征”是否齐全，缺了就重新生成或后期补上，因为解读会引用这些画面。
5. 推荐比例 7:12（竖版），出图后裁切到 1400 × 2400 像素。

## 基础提示词（每张都放在最前面）

**英文（Midjourney 等效果更好）**

```
Soviet constructivist poster, 1920s, in the style of El Lissitzky, Alexander Rodchenko, Gustav Klutsis and the Stenberg brothers. Bold diagonal composition, large flat geometric color planes, limited palette of vermilion red, deep black and aged cream paper only. Realistic human figure cut from a high-contrast black-and-white photograph (photomontage), correct anatomy, expressive heroic pose, dramatic low camera angle. Subtle halftone dot texture and paper grain, lithograph print. Strong negative space. No text, no letters, no words. Vertical tarot card composition. --ar 7:12 --style raw
```

**中文（即梦、可灵、通义万相）**

```
苏联构成主义海报风格，1920年代，参考李西茨基、罗德琴科、克鲁茨基斯和斯滕伯格兄弟的作品。大胆的斜线构图，大面积平涂几何色块，只用朱红、深黑、旧米白纸色三种颜色。人物为写实的高反差黑白照片剪影（照片拼贴手法），人体比例准确，姿态有力，低机位仰拍视角。轻微网点印刷质感和纸张纹理，石版印刷效果。留白有力。画面中不要出现任何文字。竖版塔罗牌构图，比例 7:12。
```

## 每张牌的画面描述（接在基础提示词后面）

| 编号 | 牌名 | 画面描述（英文，接在基础提示词后） | 必须出现的象征 |
| --- | --- | --- | --- |
| 0 | 愚者 | A young traveler striding confidently off the edge of a black diagonal cliff, one foot stepping into empty space, head tilted up toward a huge red sun disc, holding a white rose in one hand and a small bundle on a staff over the shoulder, a small white dog leaping at his heels | 悬崖边、红日、白玫瑰、行囊、小狗 |
| I | 魔术师 | A magician standing behind a black table, right arm raised high holding a wand toward the sky, left hand pointing to the ground, an infinity symbol above his head, on the table a cup, a sword, a wand and a coin with a star, a red diagonal beam behind him | 一手指天一手指地、无限符号、桌上杯剑杖币 |
| II | 女祭司 | A serene priestess seated between two tall pillars, one black and one cream, a crescent moon at her feet, a half-open scroll on her lap, a veil behind her, calm frontal pose | 黑白双柱、新月、半卷经卷 |
| III | 皇后 | A crowned woman reclining on cushions in a field of wheat, a shield with the Venus symbol beside her, a forest and waterfall in the background, rendered as bold planes | 麦田、金星符号盾牌、星冠 |
| IV | 皇帝 | A bearded emperor seated on a massive stone throne carved with ram heads, holding an orb and an ankh scepter, barren mountains behind him, strong frontal symmetry broken by one red diagonal | 公羊头石座、权杖与宝球、荒山 |
| V | 教皇 | A high priest raising his hand in blessing, triple crown, two kneeling followers in front of him, two crossed keys at his feet, two pillars | 祝福手势、两名信徒、交叉钥匙 |
| VI | 恋人 | A man and a woman standing apart facing each other, an angel with wide spread wings above them in a huge red sun, a tree behind each figure, a mountain between them | 天使、一男一女、两棵树 |
| VII | 战车 | A charioteer standing upright in a square chariot under a starry canopy, holding no reins, two sphinxes in front, one black and one cream, facing different directions, city walls behind | 驾车人、一黑一白两只斯芬克斯 |
| VIII | 力量 | A woman in a white robe gently closing the jaws of a lion with her bare hands, an infinity symbol above her head, a garland of flowers, calm and soft pose | 女子与狮子、无限符号 |
| IX | 隐士 | An old hermit in a long hooded cloak standing alone on a snowy mountain peak, holding a lantern containing a six-pointed star, leaning on a staff, dark sky as a black plane | 雪山顶、提灯（内有六芒星）、手杖 |
| X | 命运之轮 | A giant wheel turning in the sky as a red circle with spokes, a sphinx on top, a snake descending on one side, four winged creatures in the four corners reading books (angel, eagle, lion, bull) | 巨轮、斯芬克斯、四角四生物 |
| XI | 正义 | A figure seated frontally on a throne between two pillars, holding an upright sword in the right hand and balanced scales in the left, strict symmetry | 剑、天平、正面端坐 |
| XII | 倒吊人 | A man hanging upside down by one foot from a T-shaped living tree, his other leg bent to form a cross, hands behind his back, calm face with a halo of light | 倒挂、T 形树、头部光环 |
| XIII | 死神 | A skeleton knight in black armor riding a white horse, carrying a black banner with a white rose, a fallen king and a praying bishop before him, the sun rising between two towers in the distance | 骑白马的骷髅骑士、黑旗白玫瑰、双塔间的日出 |
| XIV | 节制 | A winged angel with one foot in a pool of water and one on land, pouring water between two cups, a path leading to a distant mountain with a crown of light | 一脚踩水一脚踏地、两杯之间倒水 |
| XV | 恶魔 | A horned demon figure with bat wings perched on a black pedestal, holding a torch, a naked man and woman loosely chained to the pedestal, the chains clearly loose around their necks | 台座、松松垮垮的锁链、一对男女 |
| XVI | 高塔 | A tall black tower struck at the top by a red lightning bolt shaped like a sharp wedge, the crown blasted off the top, two figures falling headfirst through the air, flames from the windows | 闪电击顶、王冠飞落、两人倒栽坠落 |
| XVII | 星星 | A kneeling nude woman at the edge of a pool, pouring water from two jugs, one into the pool and one onto the land, one huge eight-pointed red star above her and seven small white eight-pointed stars around it, a bird on a tree | 一颗大星七颗小星、双手倒水 |
| XVIII | 月亮 | A large moon with a calm profile face inside a crescent, a dog and a wolf howling at it, a crayfish crawling out of a pool, a winding path leading between two towers into the distance | 双塔、狗与狼、水中龙虾、小路 |
| XIX | 太阳 | A joyful naked child with arms wide open riding a white horse, carrying a long red banner flowing diagonally, a row of sunflowers over a stone wall, a giant red sun with sharp black rays filling the top | 烈日、向日葵、骑白马的孩子、红旗 |
| XX | 审判 | An angel blowing a long trumpet from the clouds with a banner bearing a cross, men, women and children rising from open coffins below with arms raised, mountains behind | 天使吹号、从棺中站起的人 |
| XXI | 世界 | A dancer floating inside a large oval laurel wreath tied with red ribbons, holding two wands, the four creatures (angel, eagle, lion, bull) in the four corners | 月桂花环、舞者、四角四生物 |

## 牌背

```
Soviet constructivist poster pattern, perfectly point-symmetric composition (identical when rotated 180 degrees), black background, a cream circle in the center pierced by two sharp red wedges coming from opposite corners, thin cream diagonal lines, halftone texture, no text. --ar 7:12
```

牌背必须中心对称，否则用户抽牌时能从牌背看出正逆位。生成后可以在设计软件里把左半边复制旋转，保证完全对称。

## 版权与合规

- 只用自己生成的图，不要用别人的作品当参考图上传（风格名称可以写，具体作品图片不要垫）。
- AI 生成图片在国内的著作权保护还不确定，后期人工修改（调整构图、统一配色、加字）能增加独创性。
- 不使用“Rider-Waite”名称。
