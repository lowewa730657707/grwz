/* 课程二：盲打 */
registerCourse({
  id: "touch",
  code: "TT",
  name: "盲打训练",
  en: "Touch Typing",
  color: "green",
  level: "零基础 → 盲打",
  duration: "约 3 小时",
  tagline: "不靠眼睛找键，让十根手指各司其职。",
  description: "盲打不是“背下键盘”，而是建立一整套空间与动作的映射。本课程从坐姿、手型、F/J 归位开始，逐指训练、脱键练习，最后用真实文本检验。",
  chapters: [
    {
      title: "第一章 · 准备",
      lead: "先让身体安静下来，手指才有余力学习。",
      lessons: [
        {
          id: "tt-01",
          title: "盲打到底在练什么",
          en: "What Touch Typing Really Is",
          summary: "理解盲打的三个核心：固定指法、触觉定位、动作回位。",
          minutes: 8,
          difficulty: 1,
          focus: ["F", "J"],
          goals: ["理解盲打与“看着键盘打字”的区别", "认识固定指法的价值", "建立以准确率为先的练习观"],
          sections: [
            {
              title: "盲打不是记忆比赛",
              html: "<p>很多人以为盲打是把整个键盘背下来。其实你不需要记住“Q 在哪里”，你只需要记住“左小指向上伸，够到左上角那个键”。盲打的核心是动作记忆，而不是视觉记忆。</p><p>当每根手指都有固定分工，大脑可以把注意力从“找键”转移到“读下一句”。这才是盲打真正带来的自由。</p>"
            },
            {
              title: "三个核心",
              html: "<ul><li><strong>固定指法：</strong>一个键只由一根手指负责，永远不临时换指。</li><li><strong>触觉定位：</strong>用 F / J 的凸起确认双手位置，不靠看。</li><li><strong>动作回位：</strong>每次离键后回到基准位，为下一次出发做准备。</li></ul>"
            },
            {
              title: "准确率优先",
              html: "<p>盲打训练中最常见的错误，是在动作还不稳定时就追求速度。速度是准确动作的副产品。当你不再需要低头确认，速度自然会上来。</p>"
            }
          ],
          type: "latin",
          drills: [
            "fff jjj fff jjj",
            "fj jf fj jf",
            "fff jjj fj jf",
            "fj fj jf jf fj jf"
          ]
        },
        {
          id: "tt-02",
          title: "坐姿与手型",
          en: "Posture and Hand Shape",
          summary: "调整桌椅、手腕和手指，让打字变成一件不会累的事。",
          minutes: 10,
          difficulty: 1,
          focus: ["F", "J"],
          goals: ["找到适合自己的椅高与屏幕高度", "保持手腕平直、手指自然弯曲", "识别紧张信号并及时放松"],
          sections: [
            {
              title: "身体是键盘的一部分",
              html: "<p>打字不是只有手指在动。椅高不对，肩膀就会耸；键盘太远，手腕就会折；屏幕太低，脖子就会前倾。先把身体安顿好，再谈指法。</p><ul><li>椅子高度：双脚能平放，膝盖约 90°。</li><li>桌面高度：前臂与地面大致平行，手肘不悬空。</li><li>屏幕：上沿略低于视线，距离约一臂。</li><li>键盘：放在身体正前方，不偏左也不偏右。</li></ul>"
            },
            {
              title: "正确手型",
              html: "<p>手指自然弯曲，像轻轻握住一个网球。指尖触键，掌根不要压在桌面上，手腕保持平直。手指不需要抬得很高，离键一两厘米就够。</p><p>如果手腕开始酸痛，先检查是不是压腕或抬肘。调整后再继续，不要硬撑。</p>"
            },
            {
              title: "每十分钟做一次检查",
              html: "<p>检查清单：肩膀是否放松？手腕是否平直？手指是否回到基准位？眼睛是否在屏幕上？四个问题都答“是”，再继续练习。</p>"
            }
          ],
          type: "latin",
          drills: [
            "asdf jkl; asdf jkl;",
            "fff jjj ddd kkk",
            "as df jk l;",
            "sad lad fall ask"
          ]
        },
        {
          id: "tt-03",
          title: "F / J 定位与回位",
          en: "Find Home, Return Home",
          summary: "把 F / J 的凸起变成双手的锚点，练习闭眼归位。",
          minutes: 10,
          difficulty: 1,
          focus: ["F", "J"],
          goals: ["闭眼找到 F / J 凸起", "建立“出发—回位”的完整动作", "在不看键盘时敲出基准键"],
          sections: [
            {
              title: "用触觉找家",
              html: "<p>把双手抬离键盘，再轻轻落下，用左右食指感受 F 和 J 上的小凸起。其他手指顺着自然顺序落在 A S D 和 K L ; 上。这个过程不要看键盘，最多用余光确认。</p><p>每天开始练习前，先做三次“抬手—落下—确认”。这是一个很小的仪式，但它会告诉大脑：现在开始打字了。</p>"
            },
            {
              title: "回位比出发更重要",
              html: "<p>敲完 <code>G</code> 后能不能回到 <code>F</code>，敲完 <code>H</code> 后能不能回到 <code>J</code>，决定了下一键的准确性。回位不是多余动作，它是下一次击键的起点。</p>"
            },
            {
              title: "闭眼练习",
              html: "<p>闭上眼，用食指敲 <code>F</code>、<code>J</code>，各十次。每次敲完都重新找凸起。如果中途迷失，停下来，重新抬手落下。不要用“猜”的方式继续。</p>"
            }
          ],
          type: "latin",
          drills: [
            "fj jf fj jf",
            "ff jj ff jj",
            "fj fj jf jf fj jf",
            "f j f j ff jj fj jf"
          ]
        }
      ]
    },
    {
      title: "第二章 · 手指分工",
      lead: "十根手指，十块领地，谁也不要越界。",
      lessons: [
        {
          id: "tt-04",
          title: "左手四指的分工",
          en: "The Left Hand",
          summary: "小指、无名指、中指、食指分别负责哪些键，以及如何独立发力。",
          minutes: 12,
          difficulty: 2,
          focus: ["A", "S", "D", "F", "Q", "W", "E", "R", "T", "Z", "X", "C", "V", "B"],
          goals: ["记住左手四指的完整负责区域", "练习无名指与小指的独立发力", "避免用食指替代弱指"],
          sections: [
            {
              title: "左手的领地",
              html: "<table><thead><tr><th>手指</th><th>基准键</th><th>上排</th><th>下排</th></tr></thead><tbody><tr><td>小指</td><td>A</td><td>Q</td><td>Z</td></tr><tr><td>无名指</td><td>S</td><td>W</td><td>X</td></tr><tr><td>中指</td><td>D</td><td>E</td><td>C</td></tr><tr><td>食指</td><td>F</td><td>R / T</td><td>V / B</td></tr></tbody></table><p>左手的难点是小指和无名指。它们力量弱、独立性差，最容易“借”中指或食指帮忙。练习时要刻意让它们单独完成动作。</p>"
            },
            {
              title: "独立发力练习",
              html: "<p>把左手平放在桌面上，依次抬起小指、无名指、中指、食指，再依次放下。每次只动一根，其他手指贴住桌面。这个动作能帮助你找到“只动一根手指”的感觉。</p>"
            },
            {
              title: "左手全区域练习",
              html: "<p>用 <code>qaz</code>、<code>wsx</code>、<code>edc</code>、<code>rfv</code>、<code>tgb</code> 五组纵向组合，检查每根手指能否从上到下走完自己的列。</p>"
            }
          ],
          type: "latin",
          drills: [
            "qaz wsx edc rfv tgb",
            "aaa sss ddd fff",
            "qaq wsw ede rfr tft",
            "asdf qwer zxcv",
            "left hand stays at home"
          ]
        },
        {
          id: "tt-05",
          title: "右手四指的分工",
          en: "The Right Hand",
          summary: "J K L ; 为锚点，右手四指覆盖右侧三排。",
          minutes: 12,
          difficulty: 2,
          focus: ["J", "K", "L", ";", "Y", "U", "I", "O", "P", "N", "M"],
          goals: ["记住右手四指的完整负责区域", "区分食指的两列", "练习小指对 P / ; 的控制"],
          sections: [
            {
              title: "右手的领地",
              html: "<table><thead><tr><th>手指</th><th>基准键</th><th>上排</th><th>下排</th></tr></thead><tbody><tr><td>食指</td><td>J</td><td>Y / U</td><td>N / M</td></tr><tr><td>中指</td><td>K</td><td>I</td><td>,</td></tr><tr><td>无名指</td><td>L</td><td>O</td><td>.</td></tr><tr><td>小指</td><td>;</td><td>P</td><td>/</td></tr></tbody></table><p>右手食指负责两列，活动范围最大；小指负责 P、;、/ 和右侧控制键，最容易疲劳。练习时注意让手指回位，不要让小指一直悬在 P 上。</p>"
            },
            {
              title: "小指的控制",
              html: "<p>单独练习 <code>;</code> 和 <code>P</code> 的往返：<code>;p; p;p</code>。小指抬起时不要带动无名指，落下时不要压到 L。可以对着镜子观察手型，或者用另一只手轻轻按住无名指，确认它没有跟着动。</p>"
            },
            {
              title: "右手全区域",
              html: "<p>用 <code>yhn</code>、<code>ujm</code>、<code>ik,</code>、<code>ol.</code>、<code>;p/</code> 五组组合，把右手各列从上到下走一遍。</p>"
            }
          ],
          type: "latin",
          drills: [
            "yhn ujm ik, ol. ;p/",
            "jjj kkk lll ;;;",
            "yuy iui opo ;p;",
            "jkl; yuiop nm,./",
            "right hand returns home"
          ]
        },
        {
          id: "tt-06",
          title: "拇指与空格",
          en: "Thumbs and Space",
          summary: "空格不是“顺手一按”，它也有固定分工和节奏。",
          minutes: 8,
          difficulty: 2,
          focus: ["Space"],
          goals: ["用拇指轻敲空格", "保持空格前后的节奏", "避免空格造成整只手移位"],
          sections: [
            {
              title: "空格由拇指负责",
              html: "<p>左右拇指都可以按空格，习惯用哪只就固定哪只，不要每次临时换。多数人用右手拇指，因为它不需要参与字母区。按空格时只动拇指，手掌不要整体下沉。</p>"
            },
            {
              title: "空格的力度",
              html: "<p>空格键面积大，很容易用力过猛。用指腹轻轻一压即可，触底就回。连续空格（例如缩进）也不要变成连续砸键。</p>"
            },
            {
              title: "空格是节奏的一部分",
              html: "<p>英文单词之间的空格，是句子的呼吸。打完一个词，拇指轻点，再进入下一个词。不要把所有空格都留到最后补。</p>"
            }
          ],
          type: "latin",
          drills: [
            "a a a a",
            "as as as as",
            "the cat sat on the mat",
            "one two three four five",
            "type with a steady rhythm"
          ]
        }
      ]
    },
    {
      title: "第三章 · 伸展与力量",
      lead: "让手指走得更远，但仍然找得到回家的路。",
      lessons: [
        {
          id: "tt-07",
          title: "上排伸展：不抬手腕",
          en: "Reach Up, Not Lift",
          summary: "练习上排字母的向上伸展，保持手腕稳定。",
          minutes: 12,
          difficulty: 3,
          focus: ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
          goals: ["用各指独立向上伸展", "保持手腕不抬起", "上排击键后立即回位"],
          sections: [
            {
              title: "伸展而不是抬升",
              html: "<p>上排字母离基准位约一个键的高度。正确动作是手指从掌指关节处向上弯，手腕保持低位。错误动作是整只手向上跳，敲完再落下来，这样每一键都多了一次无谓的移动。</p>"
            },
            {
              title: "一次只伸一根手指",
              html: "<p>练 <code>qaq</code>、<code>wsw</code>、<code>ede</code>、<code>rfr</code>、<code>tft</code>、<code>yuy</code>、<code>iui</code>、<code>opo</code>、<code>p;p</code>，每个组合只让负责的手指动。其他手指留在基准键上，像桌面上的五个小锚点。</p>"
            },
            {
              title: "上排往返测试",
              html: "<p>用 <code>qwertyuiop</code> 正序、倒序各打三遍，然后打 <code>q p w o e i r u t y</code> 这样的交替组合，检查回位是否稳定。</p>"
            }
          ],
          type: "latin",
          drills: [
            "qaq wsw ede rfr tft",
            "yuy iui opo p;p",
            "qwertyuiop poiuytrewq",
            "q p w o e i r u t y",
            "top row, low wrist"
          ]
        },
        {
          id: "tt-08",
          title: "下排下压：不塌手掌",
          en: "Reach Down, Not Collapse",
          summary: "练习下排字母的向下伸展，避免手掌整体下沉。",
          minutes: 12,
          difficulty: 3,
          focus: ["Z", "X", "C", "V", "B", "N", "M", ",", ".", "/"],
          goals: ["用各指独立向下伸展", "保持掌根稳定", "下排击键后回位到基准排"],
          sections: [
            {
              title: "向下够键的支点",
              html: "<p>下排字母需要手指向下弯。支点仍在掌指关节，手腕和掌根保持稳定。如果掌根离开桌面又重重落下，回位就会失去参照，F / J 的位置也会变模糊。</p>"
            },
            {
              title: "分组练习",
              html: "<p>左手 <code>zaz</code>、<code>xsx</code>、<code>cdc</code>、<code>vfv</code>、<code>bfb</code>；右手 <code>njn</code>、<code>mjm</code>、<code>,k,</code>、<code>.l.</code>、<code>/;/</code>。每个组合都是“基准键—下排键—基准键”的往返。</p>"
            },
            {
              title: "下排容易犯的错",
              html: "<ul><li>小指够不到 Z，用无名指代按。</li><li>够 B 时手腕向右扭。</li><li>连续下排键时整只手跟着下移。</li></ul><p>发现这些情况，先降速，回到单指练习。</p>"
            }
          ],
          type: "latin",
          drills: [
            "zaz xsx cdc vfv bfb",
            "njn mjm ,k, .l. /;/",
            "zxcvbnm,./",
            "z x c v b n m , . /",
            "bottom row, calm hand"
          ]
        },
        {
          id: "tt-09",
          title: "数字排与 Shift 协作",
          en: "Number Row and Shift",
          summary: "把最远的一排也纳入指法体系，学会左右 Shift 分工。",
          minutes: 14,
          difficulty: 3,
          focus: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "Shift"],
          goals: ["用固定手指敲数字排", "用相反手按 Shift", "数字与符号混合输入时保持回位"],
          sections: [
            {
              title: "数字排的分工",
              html: "<p>数字排是离基准位最远的一排，也是最容易“用食指横扫”的一排。固定分工如下：左手小指 <code>1</code>、无名指 <code>2</code>、中指 <code>3</code>、食指 <code>4/5</code>；右手食指 <code>6/7</code>、中指 <code>8</code>、无名指 <code>9</code>、小指 <code>0</code>。</p>"
            },
            {
              title: "Shift 的相反手原则",
              html: "<p>输入左手区的符号时用右 Shift，输入右手区的符号时用左 Shift。比如 <code>!</code> 是左小指按 1、右小指按 Shift；<code>)</code> 是右小指按 0、左小指按 Shift。</p>"
            },
            {
              title: "数字回位",
              html: "<p>数字排练习后，双手要立刻回到 ASDF / JKL;。可以用 <code>1a 2s 3d 4f 5f 6j 7j 8k 9l 0;</code> 这样的纵向组合，检查每一列的回位路线。</p>"
            }
          ],
          type: "latin",
          drills: [
            "1a 2s 3d 4f 5f 6j 7j 8k 9l 0;",
            "1234567890 0987654321",
            "1! 2@ 3# 4$ 5%",
            "6^ 7& 8* 9( 0)",
            "Call 2026, room 68."
          ]
        }
      ]
    },
    {
      title: "第四章 · 脱键",
      lead: "把眼睛从键盘上解放出来，让触觉接管。",
      lessons: [
        {
          id: "tt-10",
          title: "不看键盘训练",
          en: "Eyes Off the Keyboard",
          summary: "用遮挡、闭眼和慢速练习，建立真正的触觉定位。",
          minutes: 14,
          difficulty: 4,
          focus: ["F", "J"],
          goals: ["在完全看不到键盘时找到基准键", "用触觉而不是视觉纠错", "逐步延长不看键盘的时间"],
          sections: [
            {
              title: "遮挡键盘",
              html: "<p>用一张纸或布盖住双手和键盘，只露出屏幕。刚开始错误会明显增多，这是正常的。把速度降到平时的 60%，让触觉有足够时间工作。</p><p>如果完全遮挡让你焦虑，可以先遮住键盘、露出双手，再逐步过渡到全遮。</p>"
            },
            {
              title: "用错误定位动作",
              html: "<p>打错时不要立刻掀开遮挡。先回忆：是哪根手指、往哪个方向、大概偏了几个键？尝试修正一次，再揭开确认。这个“先猜后验”的过程，比直接看答案更能建立空间感。</p>"
            },
            {
              title: "每天 5 分钟",
              html: "<p>盲打是习惯，不是知识。每天 5 分钟的脱键练习，比周末一次练两小时更有效。把遮挡练习放在每次训练的开头，手最清醒的时候。</p>"
            }
          ],
          type: "latin",
          drills: [
            "asdf jkl; asdf jkl;",
            "the quick brown fox",
            "home row is home",
            "keep your eyes on the screen",
            "type without looking down"
          ]
        },
        {
          id: "tt-11",
          title: "节奏与击键力度",
          en: "Rhythm and Touch",
          summary: "用均匀的节奏代替忽快忽慢的爆发，找到轻触键的手感。",
          minutes: 12,
          difficulty: 4,
          focus: ["Space"],
          goals: ["建立均匀的击键间隔", "用最小力度触发按键", "在长文本中保持放松"],
          sections: [
            {
              title: "速度是节奏的结果",
              html: "<p>快速打字的听感通常是均匀的“嗒嗒嗒”，而不是一阵猛敲后突然停住。均匀的节奏意味着每一键都有准备，错误率也会更低。</p><p>可以用节拍器或心里默数：每拍一个键，连续打 20 个键，再尝试每拍两个键。</p>"
            },
            {
              title: "轻触键",
              html: "<p>机械键盘触发不需要到底，薄膜键盘也不需要砸。用刚好能让系统识别的力度，敲完立刻放松。声音变小、肩膀变松，是力度正确的信号。</p>"
            },
            {
              title: "长文本中的呼吸",
              html: "<p>每打完一句，允许自己呼一口气。不要憋气冲刺。呼吸稳定，手才稳定。</p>"
            }
          ],
          type: "latin",
          drills: [
            "asdf jkl; asdf jkl;",
            "steady steady steady",
            "tap tap tap tap tap",
            "slow is smooth and smooth is fast",
            "keep a calm and even rhythm"
          ]
        },
        {
          id: "tt-12",
          title: "错误纠正与弱键复盘",
          en: "Correct, Don't Repeat",
          summary: "区分偶然错误和动作错误，用针对性练习代替盲目重复。",
          minutes: 12,
          difficulty: 4,
          focus: ["R", "T", "V", "B"],
          goals: ["判断错误的类型", "用慢速重复修正动作", "建立每次练习后的复盘清单"],
          sections: [
            {
              title: "三种错误",
              html: "<table><thead><tr><th>类型</th><th>表现</th><th>处理</th></tr></thead><tbody><tr><td>动作错误</td><td>同一根手指总按偏</td><td>慢速单键往返，确认落点</td></tr><tr><td>回位错误</td><td>下一键总是偏一排</td><td>每键后回基准位，重新建立锚点</td></tr><tr><td>注意力错误</td><td>看错字、漏字</td><td>视线前瞻，放慢阅读速度</td></tr></tbody></table>"
            },
            {
              title: "修正动作，而不是修正结果",
              html: "<p>打错后直接退格重打，有时只是把结果改对了，动作仍然是错的。更有效的做法是停下来，空手做一次正确的手指路线，再落键。</p>"
            },
            {
              title: "复盘三问",
              html: "<p>今天最常错的两个键是什么？它们属于哪根手指？下次练习前，先做哪一组针对性热身？把答案记下来，下一次直接执行。</p>"
            }
          ],
          type: "latin",
          drills: [
            "frf ftf frf ftf",
            "vfv bfb vfv bfb",
            "teh the teh the",
            "form from form from",
            "correct the movement, not the result"
          ]
        }
      ]
    },
    {
      title: "第五章 · 实战",
      lead: "把技术放回真实文本，接受一次完整的检验。",
      lessons: [
        {
          id: "tt-13",
          title: "弱指强化训练",
          en: "Train the Weak Fingers",
          summary: "针对小指、无名指和食指双列做专项强化。",
          minutes: 14,
          difficulty: 4,
          focus: ["A", "Q", "Z", "P", ";", "/", "R", "T", "N", "M"],
          goals: ["识别自己的弱指", "完成小指与无名指的专项练习", "提高食指双列的切换精度"],
          sections: [
            {
              title: "弱指通常弱在哪",
              html: "<p>小指负责的键最多、力量最弱；无名指独立性差；食指要覆盖两列，容易混淆上下方向。弱指不是“练得少”，而是“代偿太多”——它们总被旁边的手指帮忙。</p>"
            },
            {
              title: "小指专项",
              html: "<p>左手小指：<code>aqa</code>、<code>aza</code>、<code>1a1</code>；右手小指：<code>;p;</code>、<code>;/;</code>、<code>0;0</code>。每组 10 次，慢速，确认只有小指在动。</p>"
            },
            {
              title: "食指双列专项",
              html: "<p>左手食指：<code>frf</code>、<code>ftf</code>、<code>fvf</code>、<code>fbf</code>；右手食指：<code>jnj</code>、<code>jmj</code>、<code>jyj</code>、<code>juj</code>。重点不是快，而是每次都能分清左上、右上、左下、右下四个方向。</p>"
            }
          ],
          type: "latin",
          drills: [
            "aqa aza 1a1",
            ";p; ;/; 0;0",
            "frf ftf fvf fbf",
            "jnj jmj jyj juj",
            "weak fingers need slow reps"
          ]
        },
        {
          id: "tt-14",
          title: "盲打综合测试",
          en: "Touch Typing Final Test",
          summary: "遮挡键盘完成一段综合文本，检验盲打是否真正成立。",
          minutes: 18,
          difficulty: 5,
          focus: ["A–Z", "Shift", "Punctuation"],
          goals: ["在遮挡键盘的情况下完成测试", "保持 95% 以上的准确率", "根据结果制定下一步训练计划"],
          sections: [
            {
              title: "测试方式",
              html: "<p>用布或纸盖住键盘，完成下面的文本。不要中途掀开遮挡；如果打错，允许退格，但要用触觉找到退格键。记录准确率和速度。</p>"
            },
            {
              title: "看结果，不看运气",
              html: "<p>一次测试的偶然性很大。如果准确率低于 95%，先回到弱指专项；如果准确率很高但速度偏慢，说明动作已经稳定，可以开始逐步提速。</p>"
            },
            {
              title: "下一阶段",
              html: "<p>完成本课程后，建议每天用 10 分钟复习弱键，再用真实英文段落做 15 分钟盲打练习。盲打能力需要持续使用，否则会退化。</p>"
            }
          ],
          type: "latin",
          drills: [
            "Blind typing is a habit built by repetition and attention. Keep your fingers on the home row, let your eyes stay on the screen, and trust the touch of each key.",
            "A calm rhythm is faster than a rushed burst. Slow down when you feel tension, and return to the home row after every reach.",
            "The goal is not to never make a mistake. The goal is to notice it, correct it, and keep going without looking down."
          ]
        }
      ]
    }
  ]
});
