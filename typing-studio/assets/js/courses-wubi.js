/* 课程四：五笔 */
registerCourse({
  id: "wubi",
  code: "WB",
  name: "五笔打字",
  en: "Wubi Input",
  color: "amber",
  level: "零基础 → 拆字",
  duration: "约 4.5 小时",
  tagline: "按字形拆字，用五个区、二十五个键打出汉字。",
  description: "五笔 86 版以字根为基础，把汉字拆成可编码的部件。课程从五区五位、字根口诀开始，进入键名字、一级简码、拆字原则、识别码和词组，最后用综合练习巩固。所有示例以 86 版常用编码为准。",
  chapters: [
    {
      title: "第一章 · 入门",
      lead: "先认识五个区、二十五个键，再理解字根为什么这样排。",
      lessons: [
        {
          id: "wb-01",
          title: "五笔是什么",
          en: "What Is Wubi",
          summary: "理解形码输入的逻辑：看字形、拆字根、敲编码。",
          minutes: 10,
          difficulty: 1,
          focus: ["G", "F", "D", "S", "A"],
          goals: ["理解五笔与拼音输入的区别", "知道字根、键名、简码三个概念", "完成第一组字根定位"],
          sections: [
            {
              title: "不靠读音，靠字形",
              html: "<p>拼音输入是“先读音，再选字”；五笔输入是“看字形，拆部件，再敲编码”。它不依赖你会不会读这个字，因此适合大量输入、生僻字和专业文本。</p><p>五笔把汉字拆成若干“字根”，每个字根固定落在 25 个字母键之一。你敲下的是字根的编码，输入法再根据编码还原汉字。</p>"
            },
            {
              title: "三个基础概念",
              html: "<ul><li><strong>字根：</strong>构成汉字的基本部件，例如“日”“月”“氵”“木”。</li><li><strong>键名：</strong>每个键上最有代表性的那个字根，例如 G 键的王、F 键的土。</li><li><strong>简码：</strong>常用字只取前一到三个编码，减少击键。</li></ul><p>本课程使用五笔 86 版。不同输入法可能对个别字有兼容差异，但核心规则一致。</p>"
            },
            {
              title: "先认五个键",
              html: "<p>从横区开始：<code>G 王</code>、<code>F 土</code>、<code>D 大</code>、<code>S 木</code>、<code>A 工</code>。先不要背整张表，先把这五个键和字根对应起来。下面的练习只要求你敲出字根所在的键。</p>"
            }
          ],
          type: "wubi",
          items: [
            { hanzi: "王", code: "g", parts: "G 键 · 横区一位" },
            { hanzi: "土", code: "f", parts: "F 键 · 横区二位" },
            { hanzi: "大", code: "d", parts: "D 键 · 横区三位" },
            { hanzi: "木", code: "s", parts: "S 键 · 横区四位" },
            { hanzi: "工", code: "a", parts: "A 键 · 横区五位" }
          ]
        },
        {
          id: "wb-02",
          title: "五区五位",
          en: "Five Zones, Five Positions",
          summary: "横竖撇捺折五个区，每区五个键，构成 25 个字母键。",
          minutes: 12,
          difficulty: 2,
          focus: ["G", "H", "T", "Y", "N"],
          goals: ["记住五个区的起始字母", "理解区号与位号的排列", "定位横区与竖区字根"],
          sections: [
            {
              title: "五区：横竖撇捺折",
              html: "<table><thead><tr><th>区</th><th>笔画</th><th>键位</th><th>口诀</th></tr></thead><tbody><tr><td>1 区</td><td>横</td><td>G F D S A</td><td>王土大木工</td></tr><tr><td>2 区</td><td>竖</td><td>H J K L M</td><td>目日口田山</td></tr><tr><td>3 区</td><td>撇</td><td>T R E W Q</td><td>禾白月人金</td></tr><tr><td>4 区</td><td>捺</td><td>Y U I O P</td><td>言立水火之</td></tr><tr><td>5 区</td><td>折</td><td>N B V C X</td><td>已子女又纟</td></tr></tbody></table><p>每个区从中间向两边排列：区号决定大致方向，位号决定具体位置。键盘上的 25 个字母键（除 Z）就这样被分成五组。</p>"
            },
            {
              title: "为什么是这五个区",
              html: "<p>汉字的五种基本笔画是横、竖、撇、捺、折。五笔把起笔笔画相同的字根放在同一个区，再按使用频率和结构安排在五个位上。理解这个逻辑，比死记键盘位置更容易形成整体印象。</p>"
            },
            {
              title: "先记区，再记位",
              html: "<p>横区从 G 到 A，竖区从 H 到 M，撇区从 T 到 Q，捺区从 Y 到 P，折区从 N 到 X。先记住每条斜线的起点和方向，再往里面填字根。</p>"
            }
          ],
          type: "wubi",
          items: [
            { hanzi: "王", code: "g", parts: "横区 · 一位" },
            { hanzi: "目", code: "h", parts: "竖区 · 一位" },
            { hanzi: "禾", code: "t", parts: "撇区 · 一位" },
            { hanzi: "言", code: "y", parts: "捺区 · 一位" },
            { hanzi: "已", code: "n", parts: "折区 · 一位" },
            { hanzi: "土", code: "f", parts: "横区 · 二位" },
            { hanzi: "日", code: "j", parts: "竖区 · 二位" },
            { hanzi: "白", code: "r", parts: "撇区 · 二位" },
            { hanzi: "立", code: "u", parts: "捺区 · 二位" },
            { hanzi: "子", code: "b", parts: "折区 · 二位" }
          ]
        },
        {
          id: "wb-03",
          title: "字根口诀",
          en: "The Root Rhyme",
          summary: "用口诀串起 25 个键的代表字根，建立第一张地图。",
          minutes: 14,
          difficulty: 2,
          focus: ["G–X"],
          goals: ["朗读并理解字根口诀", "把口诀与实际字根对应", "完成 15 个代表字根的定位"],
          sections: [
            {
              title: "口诀的作用",
              html: "<p>字根口诀把每个键上的主要字根串成一句顺口溜。它不是让你背完整张表，而是给你一条回忆的线索：想到“王旁青头戋五一”，就能想起 G 键上不只有“王”，还有“青头”“戋”等部件。</p>"
            },
            {
              title: "横区与竖区",
              html: "<p><strong>横区：</strong>王旁青头戋（兼）五一；土士二干十寸雨；大犬三羊古石厂；木丁西；工戈草头右框七。</p><p><strong>竖区：</strong>目具上止卜虎皮；日早两竖与虫依；口与川，字根稀；田甲方框四车力；山由贝，下框几。</p>"
            },
            {
              title: "撇、捺、折区",
              html: "<p><strong>撇区：</strong>禾竹一撇双人立，反文条头共三一；白手看头三二斤；月彡（衫）乃用家衣底；人和八，三四里；金勺缺点无尾鱼，犬旁留叉儿一点夕，氏无七。</p><p><strong>捺区：</strong>言文方广在四一，高头一捺谁人去；立辛两点六门疒；水旁兴头小倒立；火业头，四点米；之宝盖，摘礻（示）衤（衣）。</p><p><strong>折区：</strong>已半巳满不出己，左框折尸心和羽；子耳了也框向上；女刀九臼山朝西；又巴马，丢矢矣；慈母无心弓和匕，幼无力。</p>"
            },
            {
              title: "怎么练口诀",
              html: "<p>不要一次性背完。每天读一个区，边读边在键盘上找对应的键。读的时候把生僻字义放在一边，先让声音和手指建立联系。下面的练习只取每个键的代表字根，帮助你完成第一轮定位。</p>"
            }
          ],
          type: "wubi",
          items: [
            { hanzi: "金", code: "q", parts: "撇区 · 五位" },
            { hanzi: "人", code: "w", parts: "撇区 · 四位" },
            { hanzi: "月", code: "e", parts: "撇区 · 三位" },
            { hanzi: "水", code: "i", parts: "捺区 · 三位" },
            { hanzi: "火", code: "o", parts: "捺区 · 四位" },
            { hanzi: "之", code: "p", parts: "捺区 · 五位" },
            { hanzi: "女", code: "v", parts: "折区 · 三位" },
            { hanzi: "又", code: "c", parts: "折区 · 四位" },
            { hanzi: "纟", code: "x", parts: "折区 · 五位" },
            { hanzi: "口", code: "k", parts: "竖区 · 三位" },
            { hanzi: "田", code: "l", parts: "竖区 · 四位" },
            { hanzi: "山", code: "m", parts: "竖区 · 五位" },
            { hanzi: "大", code: "d", parts: "横区 · 三位" },
            { hanzi: "木", code: "s", parts: "横区 · 四位" },
            { hanzi: "工", code: "a", parts: "横区 · 五位" }
          ]
        },
        {
          id: "wb-04",
          title: "键名字",
          en: "Key-Name Characters",
          summary: "每个键的“名字”字，连敲四次即可输入。",
          minutes: 12,
          difficulty: 2,
          focus: ["G", "F", "D", "S", "A", "H", "J", "K", "L", "M"],
          goals: ["记住 25 个键名字", "掌握键名字的四次重复规则", "快速输入键名字"],
          sections: [
            {
              title: "什么是键名字",
              html: "<p>每个键上最有代表性的字根，就是这个键的“键名字”。例如 G 键是“王”，F 键是“土”。输入键名字时，只需要把该键连敲四次：王 <code>gggg</code>，土 <code>ffff</code>。</p><p>这是五笔最简单的规则之一，也是熟悉 25 个键位的最好入口。</p>"
            },
            {
              title: "25 个键名字",
              html: "<table><thead><tr><th>键</th><th>键名</th><th>键</th><th>键名</th><th>键</th><th>键名</th></tr></thead><tbody><tr><td>G</td><td>王</td><td>H</td><td>目</td><td>T</td><td>禾</td></tr><tr><td>F</td><td>土</td><td>J</td><td>日</td><td>R</td><td>白</td></tr><tr><td>D</td><td>大</td><td>K</td><td>口</td><td>E</td><td>月</td></tr><tr><td>S</td><td>木</td><td>L</td><td>田</td><td>W</td><td>人</td></tr><tr><td>A</td><td>工</td><td>M</td><td>山</td><td>Q</td><td>金</td></tr><tr><td>Y</td><td>言</td><td>U</td><td>立</td><td>I</td><td>水</td></tr><tr><td>O</td><td>火</td><td>P</td><td>之</td><td>N</td><td>已</td></tr><tr><td>B</td><td>子</td><td>V</td><td>女</td><td>C</td><td>又</td></tr><tr><td>X</td><td>纟</td><td></td><td></td><td></td><td></td></tr></tbody></table>"
            },
            {
              title: "练习方法",
              html: "<p>按区练习：横区 G F D S A，竖区 H J K L M，撇区 T R E W Q，捺区 Y U I O P，折区 N B V C X。先读一遍键名字，再连敲四次。注意每次都是同一个键，不要换指。</p>"
            }
          ],
          type: "wubi",
          items: [
            { hanzi: "王", code: "gggg", parts: "G 键名 · 连敲四次" },
            { hanzi: "土", code: "ffff", parts: "F 键名 · 连敲四次" },
            { hanzi: "大", code: "dddd", parts: "D 键名 · 连敲四次" },
            { hanzi: "木", code: "ssss", parts: "S 键名 · 连敲四次" },
            { hanzi: "工", code: "aaaa", parts: "A 键名 · 连敲四次" },
            { hanzi: "目", code: "hhhh", parts: "H 键名 · 连敲四次" },
            { hanzi: "日", code: "jjjj", parts: "J 键名 · 连敲四次" },
            { hanzi: "口", code: "kkkk", parts: "K 键名 · 连敲四次" },
            { hanzi: "田", code: "llll", parts: "L 键名 · 连敲四次" },
            { hanzi: "山", code: "mmmm", parts: "M 键名 · 连敲四次" },
            { hanzi: "禾", code: "tttt", parts: "T 键名 · 连敲四次" },
            { hanzi: "白", code: "rrrr", parts: "R 键名 · 连敲四次" },
            { hanzi: "月", code: "eeee", parts: "E 键名 · 连敲四次" },
            { hanzi: "人", code: "wwww", parts: "W 键名 · 连敲四次" },
            { hanzi: "金", code: "qqqq", parts: "Q 键名 · 连敲四次" },
            { hanzi: "言", code: "yyyy", parts: "Y 键名 · 连敲四次" },
            { hanzi: "立", code: "uuuu", parts: "U 键名 · 连敲四次" },
            { hanzi: "水", code: "iiii", parts: "I 键名 · 连敲四次" },
            { hanzi: "火", code: "oooo", parts: "O 键名 · 连敲四次" },
            { hanzi: "之", code: "pppp", parts: "P 键名 · 连敲四次" },
            { hanzi: "已", code: "nnnn", parts: "N 键名 · 连敲四次" },
            { hanzi: "子", code: "bbbb", parts: "B 键名 · 连敲四次" },
            { hanzi: "女", code: "vvvv", parts: "V 键名 · 连敲四次" },
            { hanzi: "又", code: "cccc", parts: "C 键名 · 连敲四次" },
            { hanzi: "纟", code: "xxxx", parts: "X 键名 · 连敲四次" }
          ]
        }
      ]
    },
    {
      title: "第二章 · 拆字与编码",
      lead: "把汉字拆成字根，再按规则排出编码。",
      lessons: [
        {
          id: "wb-05",
          title: "拆字四原则",
          en: "Four Rules of Decomposition",
          summary: "书写顺序、取大优先、兼顾直观、能连不交——拆字的判断顺序。",
          minutes: 14,
          difficulty: 3,
          focus: ["G", "J", "K"],
          goals: ["理解拆字的四个原则", "知道原则之间的优先级", "完成简单字的拆解判断"],
          sections: [
            {
              title: "原则一：书写顺序",
              html: "<p>拆字根时，按汉字正常的书写顺序从左到右、从上到下、从外到内。编码的顺序就是字根出现的顺序。例如“明”是“日”在前、“月”在后，所以编码以 J 开头，再接 E。</p>"
            },
            {
              title: "原则二：取大优先",
              html: "<p>在能拆成字根的前提下，尽量取笔画更多、更大的字根。不要把一个完整的字根拆碎。比如能取“木”就不要拆成“十”和“八”。</p>"
            },
            {
              title: "原则三、四：兼顾直观与连接关系",
              html: "<p>“兼顾直观”是让拆出来的字根看起来符合直觉；“能连不交”是优先选择字根之间相连的拆法，避免交叉。实际拆字时，四个原则可能冲突，优先级通常是：书写顺序 → 取大优先 → 兼顾直观 → 能连不交。</p><p>拆字没有捷径，先积累常见字，再回头理解规则。下面的练习都是两字根字，适合建立最初的拆字感。</p>"
            }
          ],
          type: "wubi",
          items: [
            { hanzi: "明", code: "je", parts: "日 + 月" },
            { hanzi: "好", code: "vb", parts: "女 + 子" },
            { hanzi: "林", code: "ss", parts: "木 + 木" },
            { hanzi: "从", code: "ww", parts: "人 + 人" },
            { hanzi: "炎", code: "oo", parts: "火 + 火" },
            { hanzi: "昌", code: "jj", parts: "日 + 日" },
            { hanzi: "吕", code: "kk", parts: "口 + 口" },
            { hanzi: "朋", code: "ee", parts: "月 + 月" },
            { hanzi: "双", code: "cc", parts: "又 + 又" },
            { hanzi: "早", code: "jh", parts: "日 + 十" }
          ]
        },
        {
          id: "wb-06",
          title: "双根字与二级简码",
          en: "Two-Root Characters",
          summary: "两个明显字根的字，常常可以直接用两个编码输入。",
          minutes: 12,
          difficulty: 3,
          focus: ["J", "E", "V", "B", "S"],
          goals: ["识别双根字", "掌握常见双根字的简码", "理解简码与全码的关系"],
          sections: [
            {
              title: "两个字的部件，两个键",
              html: "<p>“明”＝日＋月，“好”＝女＋子，“林”＝木＋木。它们由两个明显的字根组成，输入时先打前两个字根，很多常用字可以直接上屏，这就是二级简码。</p><p>简码不是“少打一个随便的键”，而是输入法预先约定的常用编码。先记常用简码，再去了解全码。</p>"
            },
            {
              title: "简码优先",
              html: "<p>实际输入时，优先尝试简码。例如“明”打 <code>je</code> 就能上屏，不需要打完整的 <code>jeg</code>。“好”打 <code>vb</code>，不需要 <code>vbg</code>。熟练之后，简码会显著减少击键。</p>"
            },
            {
              title: "不要混用规则",
              html: "<p>如果简码打不出来，再检查是不是该字没有这个简码，或者输入法版本不同。练习阶段先按本课给出的编码走，确保手和规则一致。</p>"
            }
          ],
          type: "wubi",
          items: [
            { hanzi: "明", code: "je", parts: "日 + 月 · 二级简码" },
            { hanzi: "好", code: "vb", parts: "女 + 子 · 二级简码" },
            { hanzi: "林", code: "ss", parts: "木 + 木 · 二级简码" },
            { hanzi: "从", code: "ww", parts: "人 + 人 · 二级简码" },
            { hanzi: "炎", code: "oo", parts: "火 + 火 · 二级简码" },
            { hanzi: "昌", code: "jj", parts: "日 + 日 · 二级简码" },
            { hanzi: "吕", code: "kk", parts: "口 + 口 · 二级简码" },
            { hanzi: "朋", code: "ee", parts: "月 + 月 · 二级简码" },
            { hanzi: "双", code: "cc", parts: "又 + 又 · 二级简码" },
            { hanzi: "早", code: "jh", parts: "日 + 十 · 二级简码" },
            { hanzi: "你", code: "wq", parts: "亻 + 尔 · 二级简码" },
            { hanzi: "他", code: "wb", parts: "亻 + 也 · 二级简码" },
            { hanzi: "妈", code: "vc", parts: "女 + 马 · 二级简码" },
            { hanzi: "和", code: "tk", parts: "禾 + 口 · 二级简码" },
            { hanzi: "的", code: "rq", parts: "白 + 勺 · 二级简码" }
          ]
        },
        {
          id: "wb-07",
          title: "三根与四根字",
          en: "Three and Four Roots",
          summary: "字根越多，编码越长；四码字取前三末一。",
          minutes: 14,
          difficulty: 4,
          focus: ["Q", "V", "F", "P", "L", "W"],
          goals: ["理解四码字的取码规则", "掌握常见四根字的编码", "在长编码中保持顺序"],
          sections: [
            {
              title: "最多四个编码",
              html: "<p>五笔单字编码最多四码。字根不足四个时，可能需要补识别码；字根超过四个时，取第一、第二、第三和最后一个字根。编码顺序始终跟着书写顺序。</p><p>例如“键”＝钅＋彐＋二＋廴，编码 <code>qvfp</code>；“照”＝日＋刀＋口＋灬，编码 <code>jvko</code>。</p>"
            },
            {
              title: "三根字与识别码",
              html: "<p>三个字根的字，通常取三个字根，再加一个识别码。两个或三个字根的字，识别码由“末笔笔画 + 字型结构”决定，下一课会专门练习。</p>"
            },
            {
              title: "拆分要干净",
              html: "<p>四码字最容易出错的地方，是第三个字根取错或最后一个字根漏掉。练习时先把字拆成四个部件，再按键。不要一边拆一边猜编码。</p>"
            }
          ],
          type: "wubi",
          items: [
            { hanzi: "键", code: "qvfp", parts: "钅 + 彐 + 二 + 廴" },
            { hanzi: "输", code: "lwgj", parts: "车 + 人 + 一 + 刂" },
            { hanzi: "照", code: "jvko", parts: "日 + 刀 + 口 + 灬" },
            { hanzi: "想", code: "shnu", parts: "木 + 目 + 心 + 末笔" },
            { hanzi: "教", code: "ftbt", parts: "土 + 丿 + 子 + 攵" },
            { hanzi: "练", code: "xanw", parts: "纟 + 七 + 乙 + 八" },
            { hanzi: "盘", code: "telf", parts: "舟 + 丿 + 皿 + 一" }
          ]
        },
        {
          id: "wb-08",
          title: "识别码",
          en: "The Identifier Key",
          summary: "末笔笔画 + 字型结构，决定最后一位识别码。",
          minutes: 14,
          difficulty: 4,
          focus: ["G", "H", "F", "Y", "U"],
          goals: ["理解识别码的两个维度", "掌握左右、上下、杂合三种字型", "输入常见三码字的完整编码"],
          sections: [
            {
              title: "为什么需要识别码",
              html: "<p>只取字根时，很多字会得到相同的编码。为了区分，五笔用“末笔笔画 + 字型结构”补一位识别码。它不是字根，而是用来消除重码的标记。</p>"
            },
            {
              title: "两个维度",
              html: "<p>末笔笔画：横 1、竖 2、撇 3、捺 4、折 5。字型结构：左右 1、上下 2、杂合 3。把两个数字组合成一个两位数，就得到识别码所在的键。</p><table><thead><tr><th>结构 \ 末笔</th><th>横</th><th>竖</th><th>撇</th><th>捺</th><th>折</th></tr></thead><tbody><tr><td>左右</td><td>G</td><td>H</td><td>T</td><td>Y</td><td>N</td></tr><tr><td>上下</td><td>F</td><td>J</td><td>R</td><td>U</td><td>B</td></tr><tr><td>杂合</td><td>D</td><td>K</td><td>E</td><td>I</td><td>V</td></tr></tbody></table>"
            },
            {
              title: "示例",
              html: "<p>“汉”＝氵＋又，末笔捺、左右结构，识别码是 Y，完整编码 <code>icy</code>。“字”＝宀＋子，末笔横、上下结构，识别码是 F，完整编码 <code>pbf</code>。“打”＝扌＋丁，末笔竖、左右结构，识别码是 H，完整编码 <code>rsh</code>。</p><p>注意：识别码是补在字根编码之后的，不是每个字都需要。已有四个字根的字，不再补识别码。</p>"
            }
          ],
          type: "wubi",
          items: [
            { hanzi: "汉", code: "icy", parts: "氵 + 又 + 识别码 Y" },
            { hanzi: "字", code: "pbf", parts: "宀 + 子 + 识别码 F" },
            { hanzi: "打", code: "rsh", parts: "扌 + 丁 + 识别码 H" },
            { hanzi: "明", code: "jeg", parts: "日 + 月 + 识别码 G" },
            { hanzi: "好", code: "vbg", parts: "女 + 子 + 识别码 G" },
            { hanzi: "林", code: "ssy", parts: "木 + 木 + 识别码 Y" },
            { hanzi: "从", code: "wwy", parts: "人 + 人 + 识别码 Y" },
            { hanzi: "炎", code: "oou", parts: "火 + 火 + 识别码 U" },
            { hanzi: "昌", code: "jjf", parts: "日 + 日 + 识别码 F" },
            { hanzi: "吕", code: "kkf", parts: "口 + 口 + 识别码 F" },
            { hanzi: "朋", code: "eeg", parts: "月 + 月 + 识别码 G" },
            { hanzi: "双", code: "ccy", parts: "又 + 又 + 识别码 Y" }
          ]
        }
      ]
    },
    {
      title: "第三章 · 简码",
      lead: "常用字不必打全码，一到三个键就能上屏。",
      lessons: [
        {
          id: "wb-09",
          title: "一级简码",
          en: "Level-One Short Codes",
          summary: "25 个最高频字，一个键就能输入。",
          minutes: 14,
          difficulty: 3,
          focus: ["G", "F", "D", "S", "A", "H", "J", "K", "L", "M"],
          goals: ["记住 25 个一级简码", "把简码与键位对应", "做到看到字就按对键"],
          sections: [
            {
              title: "一个键，一个字",
              html: "<p>一级简码是五笔中最高频的 25 个字，每个键对应一个。例如 G 键对应“一”，F 键对应“地”，D 键对应“在”。打这些字时只按一个键，再按空格上屏。</p><p>它们覆盖了中文里极高频的虚词和实词，是提速的第一把钥匙。</p>"
            },
            {
              title: "完整对照表",
              html: "<table><thead><tr><th>键</th><th>字</th><th>键</th><th>字</th><th>键</th><th>字</th></tr></thead><tbody><tr><td>G</td><td>一</td><td>H</td><td>上</td><td>T</td><td>和</td></tr><tr><td>F</td><td>地</td><td>J</td><td>是</td><td>R</td><td>的</td></tr><tr><td>D</td><td>在</td><td>K</td><td>中</td><td>E</td><td>有</td></tr><tr><td>S</td><td>要</td><td>L</td><td>国</td><td>W</td><td>人</td></tr><tr><td>A</td><td>工</td><td>M</td><td>同</td><td>Q</td><td>我</td></tr><tr><td>Y</td><td>主</td><td>U</td><td>产</td><td>I</td><td>不</td></tr><tr><td>O</td><td>为</td><td>P</td><td>这</td><td>N</td><td>民</td></tr><tr><td>B</td><td>了</td><td>V</td><td>发</td><td>C</td><td>以</td></tr><tr><td>X</td><td>经</td><td></td><td></td><td></td><td></td></tr></tbody></table>"
            },
            {
              title: "记忆顺序",
              html: "<p>按区记：横区“一地要在工”，竖区“上是中国同”，撇区“和的有人我”，捺区“主产不为这”，折区“民了发以经”。先读顺，再遮住字只看键，最后遮住键只看字。</p>"
            }
          ],
          type: "wubi",
          items: [
            { hanzi: "一", code: "g", parts: "G 键 · 一级简码" },
            { hanzi: "地", code: "f", parts: "F 键 · 一级简码" },
            { hanzi: "在", code: "d", parts: "D 键 · 一级简码" },
            { hanzi: "要", code: "s", parts: "S 键 · 一级简码" },
            { hanzi: "工", code: "a", parts: "A 键 · 一级简码" },
            { hanzi: "上", code: "h", parts: "H 键 · 一级简码" },
            { hanzi: "是", code: "j", parts: "J 键 · 一级简码" },
            { hanzi: "中", code: "k", parts: "K 键 · 一级简码" },
            { hanzi: "国", code: "l", parts: "L 键 · 一级简码" },
            { hanzi: "同", code: "m", parts: "M 键 · 一级简码" },
            { hanzi: "和", code: "t", parts: "T 键 · 一级简码" },
            { hanzi: "的", code: "r", parts: "R 键 · 一级简码" },
            { hanzi: "有", code: "e", parts: "E 键 · 一级简码" },
            { hanzi: "人", code: "w", parts: "W 键 · 一级简码" },
            { hanzi: "我", code: "q", parts: "Q 键 · 一级简码" },
            { hanzi: "主", code: "y", parts: "Y 键 · 一级简码" },
            { hanzi: "产", code: "u", parts: "U 键 · 一级简码" },
            { hanzi: "不", code: "i", parts: "I 键 · 一级简码" },
            { hanzi: "为", code: "o", parts: "O 键 · 一级简码" },
            { hanzi: "这", code: "p", parts: "P 键 · 一级简码" },
            { hanzi: "民", code: "n", parts: "N 键 · 一级简码" },
            { hanzi: "了", code: "b", parts: "B 键 · 一级简码" },
            { hanzi: "发", code: "v", parts: "V 键 · 一级简码" },
            { hanzi: "以", code: "c", parts: "C 键 · 一级简码" },
            { hanzi: "经", code: "x", parts: "X 键 · 一级简码" }
          ]
        },
        {
          id: "wb-10",
          title: "二级简码",
          en: "Level-Two Short Codes",
          summary: "常用双根字取前两码，减少一半击键。",
          minutes: 14,
          difficulty: 3,
          focus: ["J", "E", "V", "B", "S", "W"],
          goals: ["理解二级简码的取码方式", "记忆常用二级简码", "区分简码与全码"],
          sections: [
            {
              title: "取前两个字根",
              html: "<p>二级简码取编码的前两位。对双根字来说，就是两个字根；对多根字来说，取第一、第二个字根。例如“你”的二级简码是 <code>wq</code>，“的”是 <code>rq</code>，“和”是 <code>tk</code>。</p>"
            },
            {
              title: "常用字优先",
              html: "<p>不是所有字都有二级简码，但高频字大多有。练习时先记这些高频简码，再逐渐扩展。遇到打不出来的字，先试全码，再查简码表。</p>"
            },
            {
              title: "简码不是省略规则",
              html: "<p>不能随意把任意编码截成两码。简码是输入法预先定义的固定编码。本课列出的都是常用二级简码，请按表练习，不要自己发明。</p>"
            }
          ],
          type: "wubi",
          items: [
            { hanzi: "明", code: "je", parts: "日 + 月 · 二级简码" },
            { hanzi: "好", code: "vb", parts: "女 + 子 · 二级简码" },
            { hanzi: "林", code: "ss", parts: "木 + 木 · 二级简码" },
            { hanzi: "从", code: "ww", parts: "人 + 人 · 二级简码" },
            { hanzi: "炎", code: "oo", parts: "火 + 火 · 二级简码" },
            { hanzi: "昌", code: "jj", parts: "日 + 日 · 二级简码" },
            { hanzi: "吕", code: "kk", parts: "口 + 口 · 二级简码" },
            { hanzi: "朋", code: "ee", parts: "月 + 月 · 二级简码" },
            { hanzi: "双", code: "cc", parts: "又 + 又 · 二级简码" },
            { hanzi: "早", code: "jh", parts: "日 + 十 · 二级简码" },
            { hanzi: "全", code: "wg", parts: "人 + 王 · 二级简码" },
            { hanzi: "会", code: "wf", parts: "人 + 云 · 二级简码" },
            { hanzi: "你", code: "wq", parts: "亻 + 尔 · 二级简码" },
            { hanzi: "他", code: "wb", parts: "亻 + 也 · 二级简码" },
            { hanzi: "妈", code: "vc", parts: "女 + 马 · 二级简码" },
            { hanzi: "和", code: "tk", parts: "禾 + 口 · 二级简码" },
            { hanzi: "的", code: "rq", parts: "白 + 勺 · 二级简码" },
            { hanzi: "是", code: "jg", parts: "日 + 正 · 二级简码" }
          ]
        },
        {
          id: "wb-11",
          title: "三级简码与三码字",
          en: "Three-Code Characters",
          summary: "很多常用字打三个键就能上屏，识别码也可以被简码替代。",
          minutes: 14,
          difficulty: 4,
          focus: ["I", "C", "P", "B", "R", "S"],
          goals: ["理解三级简码的取码方式", "掌握常见三码字", "知道简码与识别码的关系"],
          sections: [
            {
              title: "三级简码",
              html: "<p>三级简码取编码的前三位。对三根字来说，就是三个字根；对需要识别码的字来说，有时三级简码可以省略识别码。例如“汉”的完整编码是 <code>icy</code>，其中 Y 是识别码；在支持三级简码的输入法里，打 <code>icy</code> 即可。</p>"
            },
            {
              title: "先记三码字",
              html: "<p>“字” <code>pbf</code>、“打” <code>rsh</code>、“明” <code>jeg</code>、“好” <code>vbg</code> 都是三码字。它们看起来像“三个字根”，实际上最后一位可能是识别码。初学阶段先按给定编码打，不必急着区分哪一位是字根、哪一位是识别码。</p>"
            },
            {
              title: "简码让输入更轻",
              html: "<p>简码的价值在于减少击键，而不是改变拆字逻辑。先理解全码，再记简码，遇到特殊情况才不会乱。练习时注意每个编码的长度，不要多敲或漏敲。</p>"
            }
          ],
          type: "wubi",
          items: [
            { hanzi: "汉", code: "icy", parts: "氵 + 又 + 识别码 Y" },
            { hanzi: "字", code: "pbf", parts: "宀 + 子 + 识别码 F" },
            { hanzi: "打", code: "rsh", parts: "扌 + 丁 + 识别码 H" },
            { hanzi: "明", code: "jeg", parts: "日 + 月 + 识别码 G" },
            { hanzi: "好", code: "vbg", parts: "女 + 子 + 识别码 G" },
            { hanzi: "林", code: "ssy", parts: "木 + 木 + 识别码 Y" },
            { hanzi: "从", code: "wwy", parts: "人 + 人 + 识别码 Y" },
            { hanzi: "炎", code: "oou", parts: "火 + 火 + 识别码 U" },
            { hanzi: "王", code: "gggg", parts: "键名字 · 四码" },
            { hanzi: "日", code: "jjjj", parts: "键名字 · 四码" }
          ]
        }
      ]
    },
    {
      title: "第四章 · 词组与文章",
      lead: "从单字到词组，击键效率会成倍提高。",
      lessons: [
        {
          id: "wb-12",
          title: "二字词组",
          en: "Two-Character Phrases",
          summary: "每个字取前两码，四个键输入一个词。",
          minutes: 14,
          difficulty: 4,
          focus: ["T", "R", "W", "U", "K", "H"],
          goals: ["掌握二字词组的取码规则", "记忆常用二字词组", "在词组中保持编码顺序"],
          sections: [
            {
              title: "二字词：2 + 2",
              html: "<p>两个字组成的词，取第一个字的前两码、第二个字的前两码，共四码。例如“我们”：我 <code>trnt</code> 取 <code>tr</code>，们 <code>wun</code> 取 <code>wu</code>，合起来是 <code>trwu</code>。</p><p>“中国”：中 <code>khk</code> 取 <code>kh</code>，国 <code>lgyi</code> 取 <code>lg</code>，编码 <code>khlg</code>。</p>"
            },
            {
              title: "词组比单字更高效",
              html: "<p>打一个词只用四码，比逐字输入节省很多选择时间。常用词组应该优先整词输入，尤其是人名、地名、固定搭配。</p>"
            },
            {
              title: "不要拆错字",
              html: "<p>词组编码建立在对单字编码的熟悉之上。如果单字前两码记错，词组一定错。练习时先默念两个字的前两码，再按键。</p>"
            }
          ],
          type: "wubi",
          items: [
            { hanzi: "我们", code: "trwu", parts: "我(tr) + 们(wu)" },
            { hanzi: "中国", code: "khlg", parts: "中(kh) + 国(lg)" },
            { hanzi: "你好", code: "wqvb", parts: "你(wq) + 好(vb)" },
            { hanzi: "学习", code: "ipnu", parts: "学(ip) + 习(nu)" },
            { hanzi: "时间", code: "jfuj", parts: "时(jf) + 间(uj)" },
            { hanzi: "汉字", code: "icpb", parts: "汉(ic) + 字(pb)" },
            { hanzi: "中文", code: "khyy", parts: "中(kh) + 文(yy)" },
            { hanzi: "打字", code: "rspb", parts: "打(rs) + 字(pb)" },
            { hanzi: "输入", code: "lwty", parts: "输(lw) + 入(ty)" },
            { hanzi: "练习", code: "xanu", parts: "练(xa) + 习(nu)" },
            { hanzi: "速度", code: "gkya", parts: "速(gk) + 度(ya)" },
            { hanzi: "课程", code: "yjtk", parts: "课(yj) + 程(tk)" },
            { hanzi: "五笔", code: "ggtt", parts: "五(gg) + 笔(tt)" },
            { hanzi: "字根", code: "pbsv", parts: "字(pb) + 根(sv)" },
            { hanzi: "键盘", code: "qvte", parts: "键(qv) + 盘(te)" },
            { hanzi: "朋友", code: "eedc", parts: "朋(ee) + 友(dc)" },
            { hanzi: "工作", code: "aawt", parts: "工(aa) + 作(wt)" },
            { hanzi: "生活", code: "tgit", parts: "生(tg) + 活(it)" },
            { hanzi: "每天", code: "txgd", parts: "每(tx) + 天(gd)" },
            { hanzi: "世界", code: "anlw", parts: "世(an) + 界(lw)" }
          ]
        },
        {
          id: "wb-13",
          title: "三字与多字词组",
          en: "Longer Phrases",
          summary: "三字词、四字词和多字词，各有取码规则。",
          minutes: 14,
          difficulty: 4,
          focus: ["Y", "T", "S", "M"],
          goals: ["掌握三字词取码规则", "掌握四字及以上词取码规则", "输入常见成语与专有名词"],
          sections: [
            {
              title: "三字词：1 + 1 + 2",
              html: "<p>三个字的词，取第一个字的第一码、第二个字的第一码、第三个字的前两码。例如“输入法”：输取 <code>l</code>，入取 <code>t</code>，法取 <code>if</code>，编码 <code>ltif</code>。</p><p>“计算机”：计取 <code>y</code>，算取 <code>t</code>，机取 <code>sm</code>，编码 <code>ytsm</code>。</p>"
            },
            {
              title: "四字词：1 + 1 + 1 + 1",
              html: "<p>四个字的词，每个字取第一码。例如“五笔字型”：五 <code>g</code>、笔 <code>t</code>、字 <code>p</code>、型 <code>g</code>，编码 <code>gtpg</code>。</p><p>“熟能生巧”：熟 <code>y</code>、能 <code>c</code>、生 <code>t</code>、巧 <code>a</code>，编码 <code>ycta</code>。</p>"
            },
            {
              title: "多字词：前三末一",
              html: "<p>超过四个字的词，取第一、第二、第三个字的第一码，再加最后一个字的第一码。例如“中华人民共和国”：中 <code>k</code>、华 <code>w</code>、人 <code>w</code>、国 <code>l</code>，编码 <code>kwwl</code>。</p>"
            }
          ],
          type: "wubi",
          items: [
            { hanzi: "输入法", code: "ltif", parts: "输(l) + 入(t) + 法(if)" },
            { hanzi: "计算机", code: "ytsm", parts: "计(y) + 算(t) + 机(sm)" },
            { hanzi: "图书馆", code: "lnqn", parts: "图(l) + 书(n) + 馆(qn)" },
            { hanzi: "打字员", code: "rpkm", parts: "打(r) + 字(p) + 员(km)" },
            { hanzi: "五笔字型", code: "gtpg", parts: "五(g) + 笔(t) + 字(p) + 型(g)" },
            { hanzi: "熟能生巧", code: "ycta", parts: "熟(y) + 能(c) + 生(t) + 巧(a)" },
            { hanzi: "全神贯注", code: "wpxi", parts: "全(w) + 神(p) + 贯(x) + 注(i)" },
            { hanzi: "得心应手", code: "tnyr", parts: "得(t) + 心(n) + 应(y) + 手(r)" },
            { hanzi: "一心一意", code: "gngu", parts: "一(g) + 心(n) + 一(g) + 意(u)" },
            { hanzi: "中华人民共和国", code: "kwwl", parts: "中(k) + 华(w) + 人(w) + 国(l)" },
            { hanzi: "中国人民解放军", code: "klwp", parts: "中(k) + 国(l) + 人(w) + 军(p)" }
          ]
        },
        {
          id: "wb-14",
          title: "文章录入",
          en: "Typing a Passage",
          summary: "把词组连起来，练习连续编码和节奏。",
          minutes: 16,
          difficulty: 4,
          focus: ["A–Z"],
          goals: ["连续输入多组词组", "在词组之间保持节奏", "减少长序列中的编码错误"],
          sections: [
            {
              title: "从词组到句子",
              html: "<p>五笔打文章时，输入单位通常是词组，而不是单字。一个熟练的五笔使用者，会把“我们今天一起学习五笔字型”拆成“我们 / 今天 / 一起 / 学习 / 五笔 / 字型”这样的词组块。</p>"
            },
            {
              title: "编码之间的呼吸",
              html: "<p>每个词组四码，打完一组，手指短暂回位，再进入下一组。不要把所有编码连成一串猛敲，那会让错误难以定位。输入法通常以空格上屏，空格也是节奏的一部分。</p>"
            },
            {
              title: "遇到不会的字",
              html: "<p>文章录入时难免遇到不会拆的字。先跳过，用其他方式补上，不要让一个生僻字打断整段节奏。练习结束后再把生僻字单独拆一遍。</p>"
            }
          ],
          type: "wubi",
          items: [
            { hanzi: "我们", code: "trwu", parts: "我(tr) + 们(wu)" },
            { hanzi: "今天", code: "wygd", parts: "今(wy) + 天(gd)" },
            { hanzi: "工作", code: "aawt", parts: "工(aa) + 作(wt)" },
            { hanzi: "学习", code: "ipnu", parts: "学(ip) + 习(nu)" },
            { hanzi: "五笔", code: "ggtt", parts: "五(gg) + 笔(tt)" },
            { hanzi: "字型", code: "pbga", parts: "字(pb) + 型(ga)" },
            { hanzi: "中国", code: "khlg", parts: "中(kh) + 国(lg)" },
            { hanzi: "汉字", code: "icpb", parts: "汉(ic) + 字(pb)" },
            { hanzi: "输入", code: "lwty", parts: "输(lw) + 入(ty)" },
            { hanzi: "速度", code: "gkya", parts: "速(gk) + 度(ya)" },
            { hanzi: "每天", code: "txgd", parts: "每(tx) + 天(gd)" },
            { hanzi: "练习", code: "xanu", parts: "练(xa) + 习(nu)" },
            { hanzi: "时间", code: "jfuj", parts: "时(jf) + 间(uj)" },
            { hanzi: "朋友", code: "eedc", parts: "朋(ee) + 友(dc)" }
          ]
        }
      ]
    },
    {
      title: "第五章 · 综合",
      lead: "处理易错点，完成一次完整的五笔测试。",
      lessons: [
        {
          id: "wb-15",
          title: "易错字与编码习惯",
          en: "Common Wubi Pitfalls",
          summary: "末笔判断、字型判断、简码优先级——最常见的三类错误。",
          minutes: 14,
          difficulty: 5,
          focus: ["G", "H", "F", "Y", "U"],
          goals: ["识别识别码的常见错误", "建立先简码后全码的习惯", "复习高频易错编码"],
          sections: [
            {
              title: "易错点一：末笔判断",
              html: "<p>识别码依赖末笔笔画。有些字的最后一笔容易被看错，例如带“廴”“辶”的字，末笔通常按被包围部分的末笔处理。遇到不确定的字，先查编码，再反推末笔，不要凭感觉猜。</p>"
            },
            {
              title: "易错点二：字型判断",
              html: "<p>左右、上下、杂合三种结构，有时并不直观。例如“连”是杂合结构，“字”是上下结构。判断字型时看整体结构，不要只看局部。</p>"
            },
            {
              title: "易错点三：忘记简码",
              html: "<p>很多字有一级、二级或三级简码。习惯了全码后，容易多打无用的键。练习时先试简码，再补全码；但不要自己截断编码，简码是固定表，不是任意缩写。</p>"
            }
          ],
          type: "wubi",
          items: [
            { hanzi: "一", code: "g", parts: "一级简码" },
            { hanzi: "是", code: "j", parts: "一级简码" },
            { hanzi: "的", code: "r", parts: "一级简码" },
            { hanzi: "我", code: "q", parts: "一级简码" },
            { hanzi: "不", code: "i", parts: "一级简码" },
            { hanzi: "明", code: "je", parts: "二级简码" },
            { hanzi: "好", code: "vb", parts: "二级简码" },
            { hanzi: "你", code: "wq", parts: "二级简码" },
            { hanzi: "的", code: "rq", parts: "二级简码" },
            { hanzi: "汉", code: "icy", parts: "识别码 Y" },
            { hanzi: "字", code: "pbf", parts: "识别码 F" },
            { hanzi: "打", code: "rsh", parts: "识别码 H" },
            { hanzi: "林", code: "ssy", parts: "识别码 Y" },
            { hanzi: "炎", code: "oou", parts: "识别码 U" },
            { hanzi: "朋", code: "eeg", parts: "识别码 G" }
          ]
        },
        {
          id: "wb-16",
          title: "五笔综合测试",
          en: "Wubi Final Test",
          summary: "混合字根、简码、识别码和词组，完成最终检验。",
          minutes: 18,
          difficulty: 5,
          focus: ["A–Z"],
          goals: ["完成混合编码测试", "保持 95% 以上的准确率", "找到下一步需要强化的规则"],
          sections: [
            {
              title: "测试说明",
              html: "<p>下面的练习混合了一级简码、二级简码、识别码和词组。尽量按顺序完成，不要因为一个编码卡住而反复重来。结束后记录准确率，看看错误集中在哪一类规则。</p>"
            },
            {
              title: "结果怎么读",
              html: "<p>错误集中在识别码，就回到第 8 课；简码反应慢，就复习第 9、10 课；词组编码错，就回到第 12、13 课。五笔的提升不是“多打”，而是“按规则分类修正”。</p>"
            },
            {
              title: "继续练习",
              html: "<p>完成课程后，建议每天用 10 分钟做词组练习，再用真实文章做 15 分钟录入。遇到不会拆的字，记录下来，按“字根顺序 + 识别码”重新拆一遍。</p>"
            }
          ],
          type: "wubi",
          items: [
            { hanzi: "中", code: "k", parts: "一级简码" },
            { hanzi: "国", code: "l", parts: "一级简码" },
            { hanzi: "人", code: "w", parts: "一级简码" },
            { hanzi: "民", code: "n", parts: "一级简码" },
            { hanzi: "明", code: "je", parts: "二级简码" },
            { hanzi: "好", code: "vb", parts: "二级简码" },
            { hanzi: "林", code: "ss", parts: "二级简码" },
            { hanzi: "朋", code: "ee", parts: "二级简码" },
            { hanzi: "汉", code: "icy", parts: "识别码 Y" },
            { hanzi: "字", code: "pbf", parts: "识别码 F" },
            { hanzi: "打", code: "rsh", parts: "识别码 H" },
            { hanzi: "照", code: "jvko", parts: "四码字" },
            { hanzi: "我们", code: "trwu", parts: "二字词组" },
            { hanzi: "中国", code: "khlg", parts: "二字词组" },
            { hanzi: "学习", code: "ipnu", parts: "二字词组" },
            { hanzi: "输入法", code: "ltif", parts: "三字词组" },
            { hanzi: "计算机", code: "ytsm", parts: "三字词组" },
            { hanzi: "五笔字型", code: "gtpg", parts: "四字词组" },
            { hanzi: "熟能生巧", code: "ycta", parts: "四字词组" }
          ]
        }
      ]
    }
  ]
});
