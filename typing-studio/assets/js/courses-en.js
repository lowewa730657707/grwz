/* 课程一：英文打字 */
registerCourse({
  id: "english",
  code: "EN",
  name: "英文打字",
  en: "English Typing",
  color: "blue",
  level: "零基础 → 进阶",
  duration: "约 4 小时",
  tagline: "从 26 个字母到整段英文，建立准确的英文输入节奏。",
  description: "以英文键位为主线，逐排、逐指拆解，再进入高频词、大小写、标点、数字和段落。每一课只增加少量新键，让手在熟悉的节奏里扩展版图。",
  chapters: [
    {
      title: "第一章 · 键位起步",
      lead: "先把身体和手指放到正确的位置，再开始追求速度。",
      lessons: [
        {
          id: "en-01",
          title: "键盘、坐姿与第一次击键",
          en: "Know Your Keyboard",
          summary: "认识 68 键布局、基准键和正确坐姿，完成第一次有意识的击键。",
          minutes: 10,
          difficulty: 1,
          focus: ["F", "J"],
          goals: [
            "看懂 5 行 68 键的键盘布局",
            "调整椅高、屏幕距离与手腕姿态",
            "用食指找到 F / J 并轻击后回位"
          ],
          sections: [
            {
              title: "先看键盘：5 行，68 个键",
              html: "<p>本课程使用一块紧凑的 68 键键盘：字母区、数字区、控制键和方向键全部收在 5 行之内。它没有花哨的异形键，所有键都是整齐的长方形，并按 16 列网格对齐；只有 Enter、Shift、空格这类键会跨越多列。这样做的目的只有一个——让你的眼睛和手指都更容易建立稳定的空间记忆。</p><p>键盘从上到下分为：数字排、上排、基准排、下排和底排。真正承担打字任务的，是中间三排字母键。数字、标点和控制键，都是在这三排的基础上向外伸展。</p>"
            },
            {
              title: "基准排：手指的家",
              html: "<p>把左手食指放在 <code>F</code>，右手食指放在 <code>J</code>。这两个键上通常有小凸起，是键盘给手指的触觉路标。其余手指自然落在相邻键上：左手 <code>A S D F</code>，右手 <code>J K L ;</code>。</p><p>这就是“基准位”。每敲完一个离家的键，手指都要回到基准位。速度不是靠手在键盘上乱飞，而是靠一次次短距离出发、准确回位积累出来的。</p>"
            },
            {
              title: "坐姿：让手臂有地方“悬”",
              html: "<ul><li>双脚平放地面，膝盖约 90°，不要翘腿。</li><li>椅背支撑下背，身体略向后坐，不要趴在桌沿。</li><li>手肘自然下垂，角度约 90°–100°，前臂与键盘几乎平行。</li><li>手腕保持平直、轻微悬空，不要压在桌面上，也不要向上折。</li><li>屏幕上沿略低于视线，距离约一臂；每 20 分钟抬头看远处 20 秒。</li></ul><p>手指击键的力气只需要“按下”，不需要“砸下”。用最小的力气让按键触发，剩下的力气留给准确度。</p>"
            },
            {
              title: "第一次击键：短、轻、回位",
              html: "<p>先不要看速度。用左手食指敲 <code>F</code>，右手食指敲 <code>J</code>，每敲一次都确认手指回到了凸起上。击键动作像弹簧：指节微微抬起，快速下落，触底即回，不要在键帽上停留。</p><p>如果肩膀开始耸起、手指开始发僵，停下来甩甩手，再继续。放松不是速度的敌人，紧张才是。</p>"
            },
            {
              title: "常见问题",
              html: "<table><thead><tr><th>现象</th><th>原因</th><th>调整</th></tr></thead><tbody><tr><td>总想低头看键盘</td><td>对键位没有空间感</td><td>先用 F / J 定位，闭眼摸两次再睁眼</td></tr><tr><td>手腕压在桌上</td><td>椅子太低或键盘太远</td><td>抬高座椅，把键盘拉近到身体正前方</td></tr><tr><td>击键声音很大</td><td>用手指砸键</td><td>减小幅度，触底即回</td></tr></tbody></table>"
            }
          ],
          type: "latin",
          drills: [
            "fff jjj fff jjj",
            "fj fj jf jf fj jf",
            "fff jjj fj jf fj jf",
            "fj fj jf jf ff jj"
          ]
        },
        {
          id: "en-02",
          title: "左手基准键 ASDF",
          en: "Left Home Row",
          summary: "让左手四指各就各位：小指 A、无名指 S、中指 D、食指 F。",
          minutes: 12,
          difficulty: 1,
          focus: ["A", "S", "D", "F"],
          goals: ["记住左手四指与 ASDF 的对应关系", "在不看键盘的情况下敲出四个基准键", "建立击键后回位的习惯"],
          sections: [
            {
              title: "四根手指，四个键",
              html: "<p>左手小指负责 <code>A</code>，无名指负责 <code>S</code>，中指负责 <code>D</code>，食指负责 <code>F</code>。它们不是“随便找一根手指按”，而是固定分工。固定分工的价值在于：同一个键永远由同一根手指负责，大脑只需要记住一条路线。</p><p>刚开始你会觉得小指和无名指很不听话，这是正常的。它们平时很少独立发力，需要几天的重复才能建立稳定的控制。</p>"
            },
            {
              title: "动作要点",
              html: "<ul><li>指尖立起来，用指腹前部触键，不要用指甲敲。</li><li>只动负责该键的手指，其他手指尽量留在基准位。</li><li>按完立刻放松，指腹仍贴着键帽，但不再施力。</li><li>手腕保持不动，让手指完成上下动作。</li></ul><p>练习时可以先慢到“每个键都看清手指是怎么落的”，再逐渐加快。慢而正确，比快而混乱更快形成肌肉记忆。</p>"
            },
            {
              title: "如何检查自己有没有看键盘",
              html: "<p>把视线固定在屏幕上，用余光确认手指位置。如果你发现自己在用眼睛“找”键，停下来，回到 F 的凸起，重新出发。看不见的键盘，才是你真正学会的键盘。</p>"
            }
          ],
          type: "latin",
          drills: [
            "asdf asdf asdf",
            "aa ss dd ff",
            "as df sa fd",
            "asdf fdsa asdf fdsa",
            "ad as af da sa fa",
            "asdf jkl; asdf jkl;"
          ]
        },
        {
          id: "en-03",
          title: "右手基准键 JKL;",
          en: "Right Home Row",
          summary: "右手四指接管 J K L ;，与左手组成完整的基准排。",
          minutes: 12,
          difficulty: 1,
          focus: ["J", "K", "L", ";"],
          goals: ["记住右手四指与 JKL; 的对应关系", "左右手交替时保持节奏", "让无名指和小指稳定触键"],
          sections: [
            {
              title: "右手的固定分工",
              html: "<p>右手食指落在 <code>J</code> 的凸起上，中指负责 <code>K</code>，无名指负责 <code>L</code>，小指负责 <code>;</code>。注意：<code>;</code> 不是“多余的键”，它是右手小指的基准键，也是后面输入冒号和引号的基础。</p><p>右手小指同样是最容易“飞起来”的手指。练习时让它贴着 <code>;</code>，只在需要时短促发力。</p>"
            },
            {
              title: "左右手交替",
              html: "<p>当练习从 <code>asdf</code> 过渡到 <code>jkl;</code> 时，双手应同时留在基准位，不要一只手敲、另一只手悬空等待。均匀的交替会让节奏自然出现：左—右—左—右，像走路一样。</p><p>如果两只手总是同时移动，说明你在用整条手臂“找键”。把动作收回到手指，前臂只负责支撑。</p>"
            },
            {
              title: "小指练习法",
              html: "<p>小指力量弱，容易用整只手代偿。可以单独做几组 <code>;</code> 的慢速击键：抬起小指约一厘米，垂直落下，触底即回。不要追求声音，追求每一次都落在同一个位置。</p>"
            }
          ],
          type: "latin",
          drills: [
            "jkl; jkl; jkl;",
            "jj kk ll ;;",
            "jk kl l; ;l",
            "jkl; ;lkj jkl; ;lkj",
            "asdf jkl; asdf jkl;",
            "aj sk dl f; ja ks ld ;f"
          ]
        },
        {
          id: "en-04",
          title: "G 与 H：食指的横向移动",
          en: "Reach for G and H",
          summary: "从 F 向右够到 G，从 J 向左够到 H，再准确回到凸起。",
          minutes: 10,
          difficulty: 1,
          focus: ["G", "H"],
          goals: ["用左手食指敲 G", "用右手食指敲 H", "完成 G/H 后立即回位"],
          sections: [
            {
              title: "G 和 H 为什么特殊",
              html: "<p><code>G</code> 在 <code>F</code> 的右边，由左手食指负责；<code>H</code> 在 <code>J</code> 的左边，由右手食指负责。它们是基准排里唯一需要“横向伸一下”的字母，也是很多人开始看键盘的起点。</p><p>动作不是整只手平移，而是食指从指根处向内侧伸展，其他三指尽量留在原位。敲完后，食指要能凭凸起直接回到 F 或 J。</p>"
            },
            {
              title: "先定位，再伸展",
              html: "<p>练习顺序建议：先敲 <code>F</code> 确认凸起，再伸到 <code>G</code>，然后回到 <code>F</code>；右手同理，<code>J → H → J</code>。把“出发—触键—回位”当成一个完整动作，而不是三个分离的动作。</p>"
            },
            {
              title: "组合练习",
              html: "<p>当 G/H 稳定后，把它们放回单词里：<code>fgf</code>、<code>jhj</code>、<code>gh</code>、<code>hug</code>。注意不要因为单词熟悉就回到看键盘的老习惯。</p>"
            }
          ],
          type: "latin",
          drills: [
            "fgf jhj fgf jhj",
            "gh gh hg hg",
            "fgf jhj gh hg",
            "asdfg hjkl;",
            "g h g h gh hg",
            "gas has hug high"
          ]
        }
      ]
    },
    {
      title: "第二章 · 全键覆盖",
      lead: "从基准排出发，向上、向下各扩展一行，直到覆盖全部字母。",
      lessons: [
        {
          id: "en-05",
          title: "Q W E R T：上排左翼",
          en: "Top Row, Left",
          summary: "左手小指到食指向上伸展，覆盖 Q W E R T。",
          minutes: 12,
          difficulty: 2,
          focus: ["Q", "W", "E", "R", "T"],
          goals: ["建立上排左翼的指法映射", "掌握向上伸展后回位的幅度", "把新键放进短词中练习"],
          sections: [
            {
              title: "上排左翼的分工",
              html: "<p>从基准位向上：<code>Q</code> 由左小指负责，<code>W</code> 由左无名指负责，<code>E</code> 由左中指负责，<code>R</code> 和 <code>T</code> 都由左手食指负责。食指要覆盖两列，所以它在上排会分别向左上、右上伸展。</p><p>记住一个原则：手指向上“够”，手腕不向上抬。手腕一旦抬起，回位就会失去参照。</p>"
            },
            {
              title: "R 与 T：同一根手指的两个方向",
              html: "<p><code>R</code> 在 <code>F</code> 的左上方，<code>T</code> 在 <code>F</code> 的右上方。练习时先慢速交替 <code>frf</code> 和 <code>ftf</code>，感受食指在两条斜线之间切换。不要用整只手掌去带。</p>"
            },
            {
              title: "短词巩固",
              html: "<p>把新键放进有意义的词里，大脑会同时记住动作和语境：<code>tree</code>、<code>water</code>、<code>quiet</code>、<code>write</code>。遇到不熟的词，先拆成两三个字母一组，再连起来。</p>"
            }
          ],
          type: "latin",
          drills: [
            "qwert qwert qwert",
            "qq ww ee rr tt",
            "qwer trew qwer trew",
            "frf ftf frf ftf",
            "we rt ty qw er",
            "tree water quiet write"
          ]
        },
        {
          id: "en-06",
          title: "Y U I O P：上排右翼",
          en: "Top Row, Right",
          summary: "右手食指到小指向上伸展，覆盖 Y U I O P。",
          minutes: 12,
          difficulty: 2,
          focus: ["Y", "U", "I", "O", "P"],
          goals: ["建立上排右翼的指法映射", "区分 U 与 Y 的食指路线", "左右上排交替时保持回位"],
          sections: [
            {
              title: "上排右翼的分工",
              html: "<p><code>Y</code> 和 <code>U</code> 由右手食指负责，<code>I</code> 由右中指，<code>O</code> 由右无名指，<code>P</code> 由右小指。和左边一样，手指向上伸，手腕保持低位。</p><p><code>Y</code> 是右食指向左上方够，<code>U</code> 是右食指向右上方够。它们和 <code>H</code> 共用一条“食指延长线”，练熟之后会非常顺。</p>"
            },
            {
              title: "小指与无名指的独立性",
              html: "<p><code>O</code> 和 <code>P</code> 是最容易带动整只右手的位置。练习时把右手掌固定住，只让无名指和小指上下移动。如果 <code>P</code> 总是敲成 <code>O</code>，说明小指没有真正伸到位置，而不是速度不够。</p>"
            },
            {
              title: "组合练习",
              html: "<p>先做 <code>yuy</code>、<code>iui</code>、<code>opo</code> 这类三键往返，再把它们放进 <code>you</code>、<code>type</code>、<code>point</code>、<code>people</code> 等词里。</p>"
            }
          ],
          type: "latin",
          drills: [
            "yuiop yuiop yuiop",
            "yy uu ii oo pp",
            "yu io op ui po",
            "yuy iui opo yuy",
            "you type point people",
            "qwert yuiop qwert yuiop"
          ]
        },
        {
          id: "en-07",
          title: "Z X C V B：下排左翼",
          en: "Bottom Row, Left",
          summary: "左手向下伸展，覆盖 Z X C V B，学会“下压后回弹”。",
          minutes: 12,
          difficulty: 2,
          focus: ["Z", "X", "C", "V", "B"],
          goals: ["建立下排左翼的指法映射", "控制向下伸展的幅度", "避免手掌整体下沉"],
          sections: [
            {
              title: "下排左翼的分工",
              html: "<p><code>Z</code> 由左小指，<code>X</code> 由左无名指，<code>C</code> 由左中指，<code>V</code> 和 <code>B</code> 由左食指。下排离基准位更远，但动作方向更自然：手指向下弯，而不是整只手向下压。</p>"
            },
            {
              title: "向下够键的常见错误",
              html: "<ul><li>手掌整体下沉，导致回位时找不到 F。</li><li>小指翘起，用无名指代按 Z。</li><li>为了够 B 把食指伸得过直，手腕跟着向右扭。</li></ul><p>正确做法是保持掌根稳定，让手指像挂钩一样向下弯。敲完后手指放松，基准位会自然把手指“吸”回来。</p>"
            },
            {
              title: "词中练习",
              html: "<p><code>zebra</code>、<code>voice</code>、<code>cover</code>、<code>brave</code> 这些词同时包含下排键和上排键，适合检查回位是否稳定。先分组慢打，再连成词。</p>"
            }
          ],
          type: "latin",
          drills: [
            "zxcvb zxcvb zxcvb",
            "zz xx cc vv bb",
            "zx cv bn xz vc",
            "az sx dc fv gb",
            "zebra voice cover brave",
            "abc xyz cvb bvc"
          ]
        },
        {
          id: "en-08",
          title: "N M , . /：下排右翼",
          en: "Bottom Row, Right",
          summary: "右手向下伸展，覆盖 N M 与 , . /，同时认识标点的位置。",
          minutes: 12,
          difficulty: 2,
          focus: ["N", "M", ",", ".", "/"],
          goals: ["建立下排右翼的指法映射", "用中指、无名指、小指敲 , . /", "理解标点在英文输入中的位置"],
          sections: [
            {
              title: "下排右翼的分工",
              html: "<p><code>N</code> 和 <code>M</code> 由右手食指负责，<code>,</code> 由右中指，<code>.</code> 由右无名指，<code>/</code> 由右小指。和左翼对称：食指覆盖两列，其余手指各守一键。</p>"
            },
            {
              title: "让标点也成为肌肉记忆",
              html: "<p>逗号、句号、斜杠在英文里出现频率很高。不要把标点当成“额外任务”，它们和字母一样有固定手指。写句子时，句号后的空格也要用拇指完成，保持节奏不断。</p>"
            },
            {
              title: "找 N 与 M 的边界",
              html: "<p><code>N</code> 在 <code>J</code> 的左下方，<code>M</code> 在 <code>J</code> 的右下方。用 <code>jnj</code> 和 <code>jmj</code> 慢速往返，确认右食指能分清两条斜线。如果总是按到相邻键，先降低速度，别让惯性替你选键。</p>"
            }
          ],
          type: "latin",
          drills: [
            "nm,./ nm,./ nm,./",
            "nn mm ,, .. //",
            "nm ,. / mn /. ,",
            "jnj jmj nm mn",
            "name time, then run.",
            "man, moon; nine. fine/"
          ]
        },
        {
          id: "en-09",
          title: "26 个字母混合练习",
          en: "All Letters Together",
          summary: "打散所有字母，检查从任意键出发都能准确回位。",
          minutes: 14,
          difficulty: 2,
          focus: ["A–Z"],
          goals: ["覆盖全部 26 个字母", "在混合顺序中保持基准位意识", "找出仍然需要低头确认的键"],
          sections: [
            {
              title: "从“按顺序”到“按需要”",
              html: "<p>前面的课程按行、按手分组，接下来要把顺序打乱。真正的打字不会按字母表出现，所以你需要练习“任意键 → 基准位 → 任意键”的循环。</p><p>先做字母表正序和倒序，再做随机短串。遇到卡顿的键，把它记下来，单独做 10 次慢速往返。</p>"
            },
            {
              title: "用词而不是乱码",
              html: "<p>随机字母串能训练键位，但容易让大脑失去语义支撑。两者交替使用：一组随机串，一组真实短词。真实词会暴露“相邻键犹豫”，随机串会暴露“回位不稳”。</p>"
            },
            {
              title: "本课自检",
              html: "<p>完成练习后问自己三个问题：有没有低头？肩膀有没有耸起？错键是“按错手指”还是“没回到基准位”？把答案写在便签上，下一课重点观察。</p>"
            }
          ],
          type: "latin",
          drills: [
            "abcdefghijklmnopqrstuvwxyz",
            "zyxwvutsrqponmlkjihgfedcba",
            "qaz wsx edc rfv tgb yhn ujm ik,",
            "the quick brown fox jumps over the lazy dog",
            "pack my box with five dozen liquor jugs",
            "sphinx of black quartz judge my vow"
          ]
        }
      ]
    },
    {
      title: "第三章 · 单词节奏",
      lead: "把单个键连成词，把词连成有呼吸的节奏。",
      lessons: [
        {
          id: "en-10",
          title: "高频双字母与短词",
          en: "Bigrams and Short Words",
          summary: "用 th、he、in、er 等高频组合建立连续击键的节奏。",
          minutes: 12,
          difficulty: 2,
          focus: ["T", "H", "E", "I", "N", "R"],
          goals: ["熟悉英文高频字母组合", "减少组合中的停顿", "用短词建立稳定的速度基线"],
          sections: [
            {
              title: "英文打字的速度藏在组合里",
              html: "<p>英文不是 26 个独立字母的随机排列。<code>th</code>、<code>he</code>、<code>in</code>、<code>er</code>、<code>an</code> 这些双字母组合出现得极其频繁。把它们练成“一个动作”，速度会比逐个字母快很多。</p><p>练习时不要一个字母一个字母地念，试着把组合读成一个声音：<code>th</code>、<code>he</code>、<code>the</code>。</p>"
            },
            {
              title: "左手与右手的交接",
              html: "<p>高频组合往往跨越左右手，例如 <code>th</code> 是左右交替，<code>er</code> 是左—右。交替本身就是节奏。注意不要因为追求连击而让某只手悬空等待，双手始终贴近基准位。</p>"
            },
            {
              title: "短词循环",
              html: "<p>把 <code>the</code>、<code>and</code>、<code>for</code>、<code>that</code>、<code>with</code>、<code>this</code> 反复打顺。它们覆盖了英文中最常见的字母和组合，是性价比最高的练习材料。</p>"
            }
          ],
          type: "latin",
          drills: [
            "th he in er an re on at en nd",
            "the and for that with this",
            "the the and and for for",
            "there their them then than",
            "with this that these those",
            "the quick brown fox jumps over the lazy dog"
          ]
        },
        {
          id: "en-11",
          title: "常见长词拆解",
          en: "Long Words, Small Chunks",
          summary: "把长词拆成 3–4 个字母的小块，避免中途迷路。",
          minutes: 12,
          difficulty: 3,
          focus: ["W", "O", "R", "D", "S"],
          goals: ["掌握长词的分块策略", "在长词中保持回位", "减少长词末尾的错误"],
          sections: [
            {
              title: "长词不是一次打完的",
              html: "<p>遇到 <code>keyboard</code>、<code>practice</code>、<code>accuracy</code> 这样的长词，大脑如果把它当成一个整体，很容易在中途失去位置。把它拆成音节或字母块：<code>key-board</code>、<code>prac-tice</code>、<code>ac-cu-ra-cy</code>。</p><p>拆块不是停顿，而是给动作一个明确的落点。每打完一块，手指短暂回位，再进入下一块。</p>"
            },
            {
              title: "重复字母的处理",
              html: "<p>长词里常有连续相同字母，例如 <code>letter</code>、<code>success</code>。连续击同一个键时，手指要抬起再落下，不要按住不放。可以刻意放慢连续字母的速度，确保两次击键都被系统接收。</p>"
            },
            {
              title: "先准确，再连贯",
              html: "<p>先分块慢打，确认每一块都正确；再把块与块之间的间隔缩短。不要一开始就追求整词速度，那只会把错误固化。</p>"
            }
          ],
          type: "latin",
          drills: [
            "key-board key-board",
            "prac-tice prac-tice",
            "ac-cu-ra-cy ac-cu-ra-cy",
            "keyboard practice accuracy",
            "success letter rhythm strength",
            "comfortable important different"
          ]
        },
        {
          id: "en-12",
          title: "Shift 与大小写",
          en: "Shift and Capitals",
          summary: "用相反手的小指按 Shift，让大写字母和符号不再打断节奏。",
          minutes: 12,
          difficulty: 3,
          focus: ["Shift", "A", "B", "C"],
          goals: ["掌握左右 Shift 的分工", "正确输入句首大写与专有名词", "避免 Shift 造成的手型塌陷"],
          sections: [
            {
              title: "Shift 用哪只手按",
              html: "<p>规则很简单：要输入左手区的字符，就用右 Shift；要输入右手区的字符，就用左 Shift。这样两只手始终分工，不会出现同一只手同时按两个键的别扭姿势。</p><p>例如大写 <code>A</code> 用右 Shift + <code>A</code>；大写 <code>P</code> 用左 Shift + <code>P</code>。按 Shift 的小指不要死死压住，击键完成后立刻松开。</p>"
            },
            {
              title: "Shift 不只是大写",
              html: "<p>Shift 还负责数字排上方的符号：<code>!</code>、<code>@</code>、<code>#</code>、<code>$</code>、<code>%</code>、<code>^</code>、<code>&amp;</code>、<code>*</code>、<code>(</code>、<code>)</code>。它们和数字共用按键，所以按下 Shift 时，手指仍然按数字键的位置。</p>"
            },
            {
              title: "大小写切换的节奏",
              html: "<p>句首大写、专有名词、缩写都需要 Shift。练习时把它当成词的一部分，而不是额外的“切换步骤”。先在单词内部练，再放到句子里练。</p>"
            }
          ],
          type: "latin",
          drills: [
            "Hello World",
            "Keyboard Craft",
            "Alice and Bob",
            "Type Shift A, then Shift P.",
            "The Quick Brown Fox",
            "Accuracy First, Speed Second."
          ]
        },
        {
          id: "en-13",
          title: "英文标点与符号",
          en: "Punctuation and Symbols",
          summary: "把逗号、句号、引号、括号和常用符号放回固定手指。",
          minutes: 14,
          difficulty: 3,
          focus: [",", ".", ";", "'", "/", "?", "!"],
          goals: ["记住英文常用标点的键位", "区分左右手标点分工", "在句子中保持标点后的空格节奏"],
          sections: [
            {
              title: "标点也有固定手指",
              html: "<p>英文标点并不“随机散落”：<code>,</code> 归右中指，<code>.</code> 归右无名指，<code>/</code> 归右小指；<code>;</code> 和 <code>'</code> 在基准排右侧，分别由右小指和右小指右侧负责；<code>-</code> 和 <code>=</code> 在数字排右侧。</p><p>Shift 组合：<code>?</code> = Shift + <code>/</code>，<code>!</code> = Shift + <code>1</code>，<code>:</code> = Shift + <code>;</code>，<code>&quot;</code> = Shift + <code>'</code>。</p>"
            },
            {
              title: "标点后的空格",
              html: "<p>英文句子中，逗号、句号、问号、感叹号后面通常有一个空格。用拇指轻敲空格，不要用食指“跨过去”。空格同样是节奏的一部分，打得太重会让整句话断掉。</p>"
            },
            {
              title: "成对符号",
              html: "<p>括号 <code>()</code>、方括号 <code>[]</code>、花括号 <code>{}</code>、引号 <code>&quot;&quot;</code> 都是成对出现。先打左半边，再打内容，最后打右半边；不要为了“记得住”而把顺序打乱。</p>"
            }
          ],
          type: "latin",
          drills: [
            "hello, world.",
            "Wait; what?",
            "It's a test!",
            "\"Focus,\" she said.",
            "Use (small) steps, [daily].",
            "a/b, c+d, e=f, 100%."
          ]
        }
      ]
    },
    {
      title: "第四章 · 句子与段落",
      lead: "从短句到段落，练习视线、节奏和持续准确。",
      lessons: [
        {
          id: "en-14",
          title: "英文短句",
          en: "Short Sentences",
          summary: "把词、标点和空格连成完整句子，建立行内节奏。",
          minutes: 12,
          difficulty: 3,
          focus: ["Space", "Shift"],
          goals: ["连续输入完整短句", "保持句首大写与句末标点", "减少句子中间的停顿"],
          sections: [
            {
              title: "句子是新的练习单位",
              html: "<p>单词练熟后，下一步是句子。句子增加了空格、大写和标点，也增加了“提前看下一个词”的要求。打字时视线应落在当前词的前方，而不是死死盯着光标。</p>"
            },
            {
              title: "提前读，而不是打完再找",
              html: "<p>把句子按意群切开：<code>Practice makes / progress, / not perfect.</code> 眼睛先读到下一个意群，手指自然跟上。这样比逐词停顿更流畅。</p>"
            },
            {
              title: "错误处理",
              html: "<p>如果打错了，先判断是“手指没到位”还是“看错了字”。前者慢下来重打，后者把视线拉回文本。不要用连续猛敲来掩盖错误。</p>"
            }
          ],
          type: "latin",
          drills: [
            "Practice makes progress, not perfect.",
            "Type slowly, then type well.",
            "Keep your eyes on the screen.",
            "A calm hand is a fast hand.",
            "Small steps every day build speed."
          ]
        },
        {
          id: "en-15",
          title: "数字与混合符号",
          en: "Numbers and Mixed Symbols",
          summary: "练习数字排、百分号、货币符号和常见代码式组合。",
          minutes: 14,
          difficulty: 3,
          focus: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
          goals: ["用正确手指敲数字排", "掌握数字与 Shift 符号", "在英文中混合数字而不乱节奏"],
          sections: [
            {
              title: "数字排的指法",
              html: "<p>数字排从 <code>1</code> 到 <code>0</code> 依次由左小指、左无名指、左中指、左食指（4、5 两列）、右食指（6、7 两列）、右中指、右无名指、右小指负责。数字排离基准位最远，回位最容易出错，所以每次击键后都要确认手指回到基准位。</p>"
            },
            {
              title: "Shift 符号对照",
              html: "<table><thead><tr><th>按键</th><th>Shift 后</th><th>按键</th><th>Shift 后</th></tr></thead><tbody><tr><td>1</td><td>!</td><td>6</td><td>^</td></tr><tr><td>2</td><td>@</td><td>7</td><td>&amp;</td></tr><tr><td>3</td><td>#</td><td>8</td><td>*</td></tr><tr><td>4</td><td>$</td><td>9</td><td>(</td></tr><tr><td>5</td><td>%</td><td>0</td><td>)</td></tr></tbody></table>"
            },
            {
              title: "数字不要“借用”邻指",
              html: "<p>为了快，很多人会用食指横扫数字排。短期看起来快，长期会让错误率飙升。坚持固定手指，哪怕一开始慢一点。</p>"
            }
          ],
          type: "latin",
          drills: [
            "1 2 3 4 5 6 7 8 9 0",
            "2026 10 68 100%",
            "Room 304, 15 keys.",
            "Save 25% today!",
            "a1 b2 c3 d4 e5 f6",
            "Version 2.0.1, build 86."
          ]
        },
        {
          id: "en-16",
          title: "段落节奏",
          en: "Paragraph Flow",
          summary: "连续输入多句英文，练习视线前瞻和稳定呼吸。",
          minutes: 16,
          difficulty: 4,
          focus: ["Space", "Shift", "."],
          goals: ["连续完成 3–4 句英文", "在长文本中保持准确率", "建立稳定的呼吸与击键节奏"],
          sections: [
            {
              title: "段落练习看什么",
              html: "<p>段落练习不再只看单个键，而要看三个指标：错误是否集中在某几个键、速度是否忽快忽慢、肩膀是否越来越紧。发现其中任何一个，都应该主动降速。</p>"
            },
            {
              title: "呼吸与节奏",
              html: "<p>试着在标点处自然换气。打字不是憋气冲刺，而是可持续的节奏。每打完一句，允许自己有一个极短的停顿，然后继续。</p>"
            },
            {
              title: "稳定优先",
              html: "<p>一段文字里，最危险的不是慢，而是忽快忽慢。保持均匀的击键间隔，比偶尔爆发更能提高整体速度。</p>"
            }
          ],
          type: "latin",
          drills: [
            "Typing well is not about moving your fingers faster. It is about moving them with less hesitation. Keep your hands relaxed, your eyes ahead, and your rhythm steady.",
            "A good practice session is short enough to stay focused and long enough to build a habit. Take a short break, shake out your hands, and return with a clear mind."
          ]
        }
      ]
    },
    {
      title: "第五章 · 速度与准确",
      lead: "用数据找问题，用测试检验成果。",
      lessons: [
        {
          id: "en-17",
          title: "错键分析与自检",
          en: "Find Your Weak Keys",
          summary: "用容易混淆的键对做针对性练习，学会看错误而不是只看速度。",
          minutes: 12,
          difficulty: 4,
          focus: ["R", "T", "B", "V"],
          goals: ["识别自己的高频错键", "用慢速重复修正错误动作", "建立练习后的复盘习惯"],
          sections: [
            {
              title: "错误比速度更有信息量",
              html: "<p>如果每次练习只看 WPM，你会忽略真正需要修的地方。记录错键，看看它们是否集中在同一根手指、同一排或同一个方向。常见的混淆包括 <code>r/t</code>、<code>v/b</code>、<code>n/m</code>、<code>;/'</code>。</p>"
            },
            {
              title: "错键修正四步",
              html: "<ol><li>找出错键，单独做 10 次慢速击键。</li><li>加入相邻键做往返，例如 <code>frf</code>、<code>ftf</code>。</li><li>放进真实单词，确认动作在语境中仍然稳定。</li><li>回到原文，用正常速度复测。</li></ol>"
            },
            {
              title: "不要把错误“练快”",
              html: "<p>重复错误只会让错误更熟练。每次发现错误，先停下来，把正确动作重新做一遍，再继续。慢一秒，比错十次值得。</p>"
            }
          ],
          type: "latin",
          drills: [
            "br rb br rb",
            "teh the teh the",
            "vn nv vn nv",
            "form from form from",
            "quiet quite quiet quite",
            "their there they're"
          ]
        },
        {
          id: "en-18",
          title: "英文综合测试",
          en: "English Final Test",
          summary: "用一段完整英文检验字母、标点、大小写和节奏。",
          minutes: 18,
          difficulty: 5,
          focus: ["A–Z", "Shift", "Punctuation"],
          goals: ["在综合文本中保持 95% 以上准确率", "完成一次完整的速度测试", "根据结果选择下一阶段练习"],
          sections: [
            {
              title: "测试规则",
              html: "<p>尽量一次性完成，不要中途退格修改。结束后看三个数字：准确率、速度、错误分布。准确率低于 95% 时，先不要提速，回到上一课复习错键。</p>"
            },
            {
              title: "文本选择",
              html: "<p>下面的练习包含高频词、大小写、逗号、句号、撇号和数字。它不追求生僻词，而是模拟真实写作中最常见的输入场景。</p>"
            },
            {
              title: "完成后做什么",
              html: "<p>记录成绩，休息五分钟。下一轮练习优先复习错键，而不是重复整段文本。真正有效的进步，来自针对性修正。</p>"
            }
          ],
          type: "latin",
          drills: [
            "The best way to type faster is to type accurately. Speed is a result, not a target. Start with a calm posture, find the home row, and let each finger do its own job.",
            "In 2026, a good typing habit can save you hours every week. Keep a steady rhythm, use the correct Shift key, and pause at every comma and period.",
            "Practice does not make perfect. Perfect practice makes perfect. Slow down, notice your mistakes, and repeat the correct movement until it feels natural."
          ]
        }
      ]
    }
  ]
});
