/* 课程三：中文打字 */
registerCourse({
  id: "chinese",
  code: "ZH",
  name: "中文打字",
  en: "Chinese Typing",
  color: "red",
  level: "拼音基础 → 成段输入",
  duration: "约 4 小时",
  tagline: "从拼音到候选词，把中文输入变成流畅的表达。",
  description: "中文打字的核心不是“背字”，而是准确、快速地输入拼音，并熟练地从候选词里选对字。课程覆盖声韵母、易错音、词语、成语、标点和段落，既可用拼音练习，也可切到输入法实战模式。",
  chapters: [
    {
      title: "第一章 · 输入法基础",
      lead: "先理解输入法在做什么，再开始练手。",
      lessons: [
        {
          id: "zh-01",
          title: "中文输入法全景",
          en: "How Chinese Input Works",
          summary: "认识拼音、双拼、五笔和语音输入，找到适合自己的起点。",
          minutes: 10,
          difficulty: 1,
          focus: ["N", "I", "H", "A", "O"],
          goals: ["理解拼音输入的基本流程", "知道拼音、双拼、五笔的区别", "选择本课程的练习模式"],
          sections: [
            {
              title: "从按键到汉字",
              html: "<p>中文输入法做的事情，可以拆成三步：接收你敲下的字母，把它转成拼音或字根，再给出候选字词。你按下 <code>n</code> <code>i</code> <code>h</code> <code>a</code> <code>o</code>，输入法把它们识别为 <code>ni hao</code>，然后给出“你好”等候选。</p><p>所以中文打字的第一层基本功，是准确敲出拼音；第二层，是从候选里快速选对词。</p>"
            },
            {
              title: "三条常见路线",
              html: "<table><thead><tr><th>方式</th><th>特点</th><th>适合</th></tr></thead><tbody><tr><td>全拼</td><td>逐个字母输入完整拼音，学习成本低</td><td>零基础、日常输入</td></tr><tr><td>双拼</td><td>每个声母、韵母各用一个键，击键少</td><td>追求速度、愿意记规则</td></tr><tr><td>五笔</td><td>按字形拆字，重码率低</td><td>大量输入、喜欢形码</td></tr></tbody></table><p>本课程用全拼作为主线。练熟之后，你可以再学双拼或五笔。</p>"
            },
            {
              title: "先练拼音，再练选词",
              html: "<p>下面的练习是拼音模式：屏幕给出汉字和对应拼音，你敲拼音字母。等拼音稳定后，再到练习页切换“输入法实战”，用系统输入法真正打出汉字。</p>"
            }
          ],
          type: "pinyin",
          items: [
            { hanzi: "你好", pinyin: "ni hao" },
            { hanzi: "中文", pinyin: "zhong wen" },
            { hanzi: "键盘", pinyin: "jian pan" },
            { hanzi: "拼音", pinyin: "pin yin" },
            { hanzi: "输入", pinyin: "shu ru" },
            { hanzi: "汉字", pinyin: "han zi" }
          ]
        },
        {
          id: "zh-02",
          title: "声母与韵母",
          en: "Initials and Finals",
          summary: "把 23 个声母、24 个韵母读准，也敲准。",
          minutes: 14,
          difficulty: 2,
          focus: ["B", "P", "M", "F", "Z", "H"],
          goals: ["区分容易混淆的声母", "掌握常见韵母的拼写", "准确敲出单音节拼音"],
          sections: [
            {
              title: "声母：一个字开头的辅音",
              html: "<p>普通话有 23 个声母：<code>b p m f d t n l g k h j q x zh ch sh r z c s y w</code>。其中 <code>zh ch sh</code> 是翘舌音，<code>z c s</code> 是平舌音；<code>j q x</code> 后面跟 <code>i</code> 或 <code>ü</code>。</p><p>拼音输入时，声母直接对应字母。例如“中”是 <code>zhong</code>，先敲 <code>z h</code>，再敲 <code>o n g</code>。</p>"
            },
            {
              title: "韵母：声音的尾巴",
              html: "<p>常见韵母包括 <code>a o e i u ü ai ei ui ao ou iu ie üe er an en in un ün ang eng ing ong</code>。输入法里通常用 <code>v</code> 代替 <code>ü</code>：女 <code>nv</code>、绿 <code>lv</code>、略 <code>lve</code>。</p><p>韵母越长，越要分组敲，不要一口气乱冲。例如 <code>zhuang</code> 可以读成 <code>zh-u-ang</code>，手指也按这个节奏走。</p>"
            },
            {
              title: "声调先不用打",
              html: "<p>主流拼音输入法默认不要求输入声调。先把字母顺序打对，等熟练后再考虑双拼或声调辅助。练习时嘴里可以默念准确读音，手上跟着拼写走。</p>"
            }
          ],
          type: "pinyin",
          items: [
            { hanzi: "八", pinyin: "ba" },
            { hanzi: "怕", pinyin: "pa" },
            { hanzi: "妈", pinyin: "ma" },
            { hanzi: "发", pinyin: "fa" },
            { hanzi: "大", pinyin: "da" },
            { hanzi: "他", pinyin: "ta" },
            { hanzi: "中", pinyin: "zhong" },
            { hanzi: "国", pinyin: "guo" },
            { hanzi: "你", pinyin: "ni" },
            { hanzi: "好", pinyin: "hao" }
          ]
        },
        {
          id: "zh-03",
          title: "候选、选词与上屏",
          en: "Candidates and Selection",
          summary: "理解候选栏、数字选词和空格上屏，减少输入中的犹豫。",
          minutes: 12,
          difficulty: 2,
          focus: ["Space", "1", "2", "3"],
          goals: ["知道候选词是如何出现的", "用数字键或空格选择候选", "练习常用词的连续输入"],
          sections: [
            {
              title: "候选栏是什么",
              html: "<p>敲完拼音后，输入法会在光标附近列出候选字词。通常第一个候选会被高亮，按空格直接上屏；其他候选可以按数字键选择，或用方向键移动。</p><p>候选的顺序会受使用频率影响。你越常用某个词，它越可能排在前面。这也是为什么“常用词”值得反复练。</p>"
            },
            {
              title: "选词的两个习惯",
              html: "<ul><li>优先选择“词”，而不是一个字一个字地选。例如输入 <code>shijian</code> 后直接选“时间”，比先选“时”再选“间”更快。</li><li>不确定候选位置时，先按空格选第一个，错了再用退格或重新输入，不要盯着候选栏犹豫太久。</li></ul>"
            },
            {
              title: "练习建议",
              html: "<p>本页的拼音练习只训练“敲对拼音”。切换到输入法实战后，你才会面对候选选择。建议先用拼音模式把字母顺序打熟，再用输入法模式练选词。</p>"
            }
          ],
          type: "pinyin",
          items: [
            { hanzi: "你好", pinyin: "ni hao" },
            { hanzi: "时间", pinyin: "shi jian" },
            { hanzi: "世界", pinyin: "shi jie" },
            { hanzi: "输入", pinyin: "shu ru" },
            { hanzi: "选择", pinyin: "xuan ze" },
            { hanzi: "候选", pinyin: "hou xuan" },
            { hanzi: "键盘", pinyin: "jian pan" },
            { hanzi: "练习", pinyin: "lian xi" }
          ]
        },
        {
          id: "zh-04",
          title: "中文标点",
          en: "Chinese Punctuation",
          summary: "中文标点与英文按键的对应关系，以及全角/半角的区别。",
          minutes: 12,
          difficulty: 2,
          focus: [",", ".", "?", "!", ":", "\"", "<", ">"],
          goals: ["记住常用中文标点的按键", "区分全角与半角", "在输入法实战中打出正确标点"],
          sections: [
            {
              title: "一个按键，两种标点",
              html: "<p>中文输入法开启后，同样的按键通常会自动输出中文标点。常见对应关系：<code>,</code> → <code>，</code>，<code>.</code> → <code>。</code>，<code>?</code> → <code>？</code>，<code>!</code> → <code>！</code>，<code>:</code> → <code>：</code>，<code>;</code> → <code>；</code>。</p><p>顿号 <code>、</code> 通常用反斜杠 <code>\\</code> 输入；书名号 <code>《》</code> 用 Shift + <code>&lt;</code> / <code>&gt;</code>；省略号 <code>……</code> 常用 Shift + <code>6</code>（不同输入法可能不同）。</p>"
            },
            {
              title: "全角与半角",
              html: "<p>中文标点通常是全角，占一个汉字宽度；英文标点是半角。写中文时混入英文半角逗号，排版会显得松散。输入法状态栏一般可以切换“中/英标点”，写代码时记得切回英文。</p>"
            },
            {
              title: "标点也讲节奏",
              html: "<p>逗号停顿短，句号停顿长，问号和感叹号带语气。打字时在标点处稍作停顿，既符合语义，也能让手指有机会回位。</p>"
            }
          ],
          type: "pinyin",
          items: [
            { hanzi: "你好，世界。", pinyin: "ni hao shi jie" },
            { hanzi: "真的吗？", pinyin: "zhen de ma" },
            { hanzi: "太好了！", pinyin: "tai hao le" },
            { hanzi: "书名《键艺》。", pinyin: "shu ming jian yi" },
            { hanzi: "他说：“开始吧。”", pinyin: "ta shuo kai shi ba" },
            { hanzi: "慢一点，会更准。", pinyin: "man yi dian hui geng zhun" }
          ]
        }
      ]
    },
    {
      title: "第二章 · 单字与音节",
      lead: "把最容易错的音，练成不需要犹豫的动作。",
      lessons: [
        {
          id: "zh-05",
          title: "高频单字",
          en: "High-Frequency Characters",
          summary: "从最高频的汉字开始，建立拼音与汉字的快速连接。",
          minutes: 12,
          difficulty: 2,
          focus: ["D", "E", "S", "H", "I"],
          goals: ["熟悉 15 个高频单字", "减少单字输入时的候选犹豫", "准确敲出零声母音节"],
          sections: [
            {
              title: "为什么要先练高频字",
              html: "<p>中文常用字高度集中。把“的、一、是、不、了、在、人、有、我、你”这些字练熟，能覆盖日常文本的很大一部分。它们大多也是输入法候选栏的常客。</p>"
            },
            {
              title: "零声母音节",
              html: "<p>“一”拼作 <code>yi</code>，“有”拼作 <code>you</code>，“我”拼作 <code>wo</code>。它们没有传统声母，但输入时仍要完整敲出字母。不要因为读音短就漏掉字母。</p>"
            },
            {
              title: "单字与词组的取舍",
              html: "<p>单独打一个字，候选往往很多；打一个常用词，候选会少很多。实际输入时，能打词就不要拆成单字。但单字练习仍然重要，它是词组的零件。</p>"
            }
          ],
          type: "pinyin",
          items: [
            { hanzi: "的", pinyin: "de" },
            { hanzi: "一", pinyin: "yi" },
            { hanzi: "是", pinyin: "shi" },
            { hanzi: "不", pinyin: "bu" },
            { hanzi: "了", pinyin: "le" },
            { hanzi: "在", pinyin: "zai" },
            { hanzi: "人", pinyin: "ren" },
            { hanzi: "有", pinyin: "you" },
            { hanzi: "我", pinyin: "wo" },
            { hanzi: "你", pinyin: "ni" },
            { hanzi: "他", pinyin: "ta" },
            { hanzi: "这", pinyin: "zhe" },
            { hanzi: "中", pinyin: "zhong" },
            { hanzi: "大", pinyin: "da" },
            { hanzi: "小", pinyin: "xiao" }
          ]
        },
        {
          id: "zh-06",
          title: "易错拼音：ü 与 v",
          en: "The Tricky ü",
          summary: "女、绿、去、学、月……这些拼音在键盘上怎么写？",
          minutes: 12,
          difficulty: 3,
          focus: ["V", "Q", "X", "Y"],
          goals: ["掌握 ü 的键盘写法", "区分 u 与 ü 的常用字", "准确输入带 ü 的音节"],
          sections: [
            {
              title: "键盘上没有 ü",
              html: "<p>标准键盘没有 <code>ü</code> 字母，拼音输入法约定用 <code>v</code> 代替：女 <code>nv</code>、绿 <code>lv</code>、略 <code>lve</code>。而 <code>ju</code>、<code>qu</code>、<code>xu</code>、<code>yu</code> 中的 <code>u</code> 实际上读作 ü，但输入时仍写 <code>u</code>。</p><p>记住两组：<code>n/l + ü</code> 写成 <code>nv/lv</code>；<code>j/q/x/y + ü</code> 写成 <code>ju/qu/xu/yu</code>。</p>"
            },
            {
              title: "不要多敲一个 v",
              html: "<p>“学”是 <code>xue</code>，不是 <code>xv e</code>；“月”是 <code>yue</code>，不是 <code>yve</code>。只有 <code>n</code>、<code>l</code> 后面的 ü 才需要写成 <code>v</code>。</p>"
            },
            {
              title: "慢速建立映射",
              html: "<p>把容易混的字成对练：女/努、绿/路、去/粗、学/苏。每打一个，嘴里念一次准确读音，让耳朵帮助手指记忆。</p>"
            }
          ],
          type: "pinyin",
          items: [
            { hanzi: "女", pinyin: "nv" },
            { hanzi: "绿", pinyin: "lv" },
            { hanzi: "去", pinyin: "qu" },
            { hanzi: "学", pinyin: "xue" },
            { hanzi: "月", pinyin: "yue" },
            { hanzi: "略", pinyin: "lve" },
            { hanzi: "云", pinyin: "yun" },
            { hanzi: "军", pinyin: "jun" },
            { hanzi: "群", pinyin: "qun" },
            { hanzi: "远", pinyin: "yuan" }
          ]
        },
        {
          id: "zh-07",
          title: "前后鼻音",
          en: "Front and Back Nasals",
          summary: "chen / cheng、lin / ling、wen / weng，练准鼻音尾。",
          minutes: 12,
          difficulty: 3,
          focus: ["N", "G"],
          goals: ["区分 an/en/in 与 ang/eng/ing", "减少前后鼻音混淆", "在词语中保持鼻音准确"],
          sections: [
            {
              title: "前鼻音与后鼻音",
              html: "<p>前鼻音以 <code>n</code> 结尾：<code>an en in un ün</code>；后鼻音以 <code>ng</code> 结尾：<code>ang eng ing ong</code>。多一个 <code>g</code>，意思可能完全不同。</p><p>例如“陈”是 <code>chen</code>，“程”是 <code>cheng</code>；“林”是 <code>lin</code>，“灵”是 <code>ling</code>。</p>"
            },
            {
              title: "听尾音，不要只看字",
              html: "<p>练习时把尾音读出来：<code>chen-n</code> 与 <code>cheng-ng</code>。手指在敲完主音节后，单独确认最后一个字母。很多人不是不会拼，而是敲到一半就急着选词。</p>"
            },
            {
              title: "对比练习",
              html: "<p>成对输入：陈/程、林/灵、温/翁、心/星、分/风。每对练五遍，注意最后一个字母是否到位。</p>"
            }
          ],
          type: "pinyin",
          items: [
            { hanzi: "陈", pinyin: "chen" },
            { hanzi: "程", pinyin: "cheng" },
            { hanzi: "林", pinyin: "lin" },
            { hanzi: "灵", pinyin: "ling" },
            { hanzi: "温", pinyin: "wen" },
            { hanzi: "翁", pinyin: "weng" },
            { hanzi: "心", pinyin: "xin" },
            { hanzi: "星", pinyin: "xing" },
            { hanzi: "分", pinyin: "fen" },
            { hanzi: "风", pinyin: "feng" }
          ]
        },
        {
          id: "zh-08",
          title: "平舌与翘舌",
          en: "z/c/s vs zh/ch/sh",
          summary: "四/十、早/找、从/冲，平翘舌的按键只差一个 h。",
          minutes: 12,
          difficulty: 3,
          focus: ["Z", "C", "S", "H"],
          goals: ["区分 z/c/s 与 zh/ch/sh", "准确敲出翘舌音的 h", "在句子中保持平翘舌稳定"],
          sections: [
            {
              title: "只差一个 h",
              html: "<p>平舌音是 <code>z c s</code>，翘舌音是 <code>zh ch sh</code>。输入时，翘舌音只比平舌音多一个 <code>h</code>。例如“四”是 <code>si</code>，“十”是 <code>shi</code>；“早”是 <code>zao</code>，“找”是 <code>zhao</code>。</p>"
            },
            {
              title: "手不要抢跑",
              html: "<p>很多人把 <code>zh</code> 打成 <code>z</code>，然后急着敲韵母。练习时把声母和韵母分成两个动作：先确认 <code>zh</code> 完成，再进入 <code>ao</code>。慢一点，但一次打对。</p>"
            },
            {
              title: "绕口令式练习",
              html: "<p>“四是四，十是十，十四是十四，四十是四十。”这句话几乎覆盖了平翘舌的核心难点。先分词慢打，再连成句。</p>"
            }
          ],
          type: "pinyin",
          items: [
            { hanzi: "四", pinyin: "si" },
            { hanzi: "十", pinyin: "shi" },
            { hanzi: "早", pinyin: "zao" },
            { hanzi: "找", pinyin: "zhao" },
            { hanzi: "从", pinyin: "cong" },
            { hanzi: "冲", pinyin: "chong" },
            { hanzi: "苏", pinyin: "su" },
            { hanzi: "书", pinyin: "shu" },
            { hanzi: "词", pinyin: "ci" },
            { hanzi: "吃", pinyin: "chi" }
          ]
        }
      ]
    },
    {
      title: "第三章 · 词语与短语",
      lead: "以词为单位输入，是中文提速最重要的一步。",
      lessons: [
        {
          id: "zh-09",
          title: "双字词",
          en: "Two-Character Words",
          summary: "用整词输入代替逐字输入，减少候选次数。",
          minutes: 12,
          difficulty: 2,
          focus: ["S", "H", "I", "J", "A", "N"],
          goals: ["熟悉常见双字词", "建立整词输入意识", "保持词语内部的连贯节奏"],
          sections: [
            {
              title: "整词输入的优势",
              html: "<p>逐字输入时，每打一个字都要选一次候选；整词输入只需要选一次。常用词在输入法里通常排在很前面，按空格就能上屏，速度会明显提高。</p><p>练习时把词当成一个整体读：<code>xuexi</code>、<code>gongzuo</code>、<code>shenghuo</code>，不要在中间停顿。</p>"
            },
            {
              title: "不要漏掉隔音",
              html: "<p>有些词的拼音连在一起会产生歧义，例如 <code>xian</code> 可能是“先”或“西安”。输入法通常能根据上下文判断，必要时可以用隔音符号 <code>'</code> 分开。本练习先用空格分隔音节，帮助你读准每个字。</p>"
            },
            {
              title: "从高频词开始",
              html: "<p>学习、工作、生活、时间、中国、汉字、打字、键盘、练习、速度——这些词覆盖了日常表达的高频场景，也包含大量基准键，是很好的综合练习材料。</p>"
            }
          ],
          type: "pinyin",
          items: [
            { hanzi: "学习", pinyin: "xue xi" },
            { hanzi: "工作", pinyin: "gong zuo" },
            { hanzi: "生活", pinyin: "sheng huo" },
            { hanzi: "时间", pinyin: "shi jian" },
            { hanzi: "中国", pinyin: "zhong guo" },
            { hanzi: "汉字", pinyin: "han zi" },
            { hanzi: "打字", pinyin: "da zi" },
            { hanzi: "键盘", pinyin: "jian pan" },
            { hanzi: "练习", pinyin: "lian xi" },
            { hanzi: "速度", pinyin: "su du" }
          ]
        },
        {
          id: "zh-10",
          title: "三字词",
          en: "Three-Character Words",
          summary: "输入法、计算机、图书馆——三字词的节奏更接近真实表达。",
          minutes: 12,
          difficulty: 3,
          focus: ["S", "J", "G", "Y"],
          goals: ["掌握常见三字词", "练习较长的连续拼音", "减少长拼音中的漏键"],
          sections: [
            {
              title: "三字词是过渡带",
              html: "<p>三字词比双字词长，但没有长到难以一口气打完。它们是练习连续拼音的好材料：<code>shurufa</code>、<code>jisuanji</code>、<code>tushuguan</code>。</p>"
            },
            {
              title: "分块而不是断气",
              html: "<p>把三字词读成“2+1”或“1+2”的节奏，例如 <code>shuru-fa</code>、<code>jisuan-ji</code>。分块是为了保持手指方向，不是让你停下来想。</p>"
            },
            {
              title: "长拼音的自检",
              html: "<p>打完一个长词后，如果候选不对，先看拼音有没有漏字母，而不是立刻换词。常见漏键是中间的 <code>g</code>、<code>h</code> 和末尾的 <code>n</code>。</p>"
            }
          ],
          type: "pinyin",
          items: [
            { hanzi: "输入法", pinyin: "shu ru fa" },
            { hanzi: "计算机", pinyin: "ji suan ji" },
            { hanzi: "图书馆", pinyin: "tu shu guan" },
            { hanzi: "打字员", pinyin: "da zi yuan" },
            { hanzi: "互联网", pinyin: "hu lian wang" },
            { hanzi: "键盘侠", pinyin: "jian pan xia" },
            { hanzi: "工作日", pinyin: "gong zuo ri" },
            { hanzi: "自信心", pinyin: "zi xin xin" }
          ]
        },
        {
          id: "zh-11",
          title: "四字成语",
          en: "Four-Character Idioms",
          summary: "用成语练习长拼音、节奏和语义分组。",
          minutes: 14,
          difficulty: 3,
          focus: ["S", "X", "Q", "C"],
          goals: ["熟悉常见成语的拼音", "在四字结构中保持节奏", "减少长词的中间错误"],
          sections: [
            {
              title: "成语自带节奏",
              html: "<p>四字成语通常按“二二”分组：熟能 / 生巧，循序 / 渐进，全神 / 贯注。手指也按这个分组走，两个音节一个小单元，打完一组短暂回位，再进入下一组。</p>"
            },
            {
              title: "意义帮助记忆",
              html: "<p>知道意思，拼音就不容易漏。比如“得心应手”是心里想什么、手里就能做到；“滴水穿石”强调持续的力量。把意义和声音连起来，比死背字母更牢。</p>"
            },
            {
              title: "不要为了快而吞音",
              html: "<p>成语里有很多 <code>zh/ch/sh</code> 和前后鼻音。吞掉一个字母，候选就会跑偏。宁可慢半拍，也要把每个音节打完整。</p>"
            }
          ],
          type: "pinyin",
          items: [
            { hanzi: "熟能生巧", pinyin: "shu neng sheng qiao" },
            { hanzi: "循序渐进", pinyin: "xun xu jian jin" },
            { hanzi: "全神贯注", pinyin: "quan shen guan zhu" },
            { hanzi: "得心应手", pinyin: "de xin ying shou" },
            { hanzi: "滴水穿石", pinyin: "di shui chuan shi" },
            { hanzi: "日积月累", pinyin: "ri ji yue lei" },
            { hanzi: "一心一意", pinyin: "yi xin yi yi" },
            { hanzi: "持之以恒", pinyin: "chi zhi yi heng" }
          ]
        },
        {
          id: "zh-12",
          title: "常用短语",
          en: "Everyday Phrases",
          summary: "把词连成短语，练习更接近口语的输入节奏。",
          minutes: 12,
          difficulty: 3,
          focus: ["J", "Y", "B", "C"],
          goals: ["连续输入常用短语", "在短语中保持空格与分词", "提高整句上屏的命中率"],
          sections: [
            {
              title: "短语是句子的预演",
              html: "<p>“今天也要加油”“保持专注”“慢慢来”这些短语，在聊天和写作中频繁出现。输入法通常能整句联想，熟练后一次上屏会比逐词输入快很多。</p>"
            },
            {
              title: "空格与分词",
              html: "<p>拼音练习里，我们用空格分隔音节，方便阅读和计数。真实输入时通常连续敲字母，由输入法自行分词。两种方式都要练：先分开打准，再连起来打顺。</p>"
            },
            {
              title: "口语感",
              html: "<p>短语有语气和停顿。打“休息一下”时，可以在心里读成“休息 / 一下”；打“先准确再速度”时，读成“先准确 / 再速度”。语义分组会自然带出节奏。</p>"
            }
          ],
          type: "pinyin",
          items: [
            { hanzi: "今天也要加油", pinyin: "jin tian ye yao jia you" },
            { hanzi: "保持专注", pinyin: "bao chi zhuan zhu" },
            { hanzi: "慢慢来", pinyin: "man man lai" },
            { hanzi: "休息一下", pinyin: "xiu xi yi xia" },
            { hanzi: "再来一次", pinyin: "zai lai yi ci" },
            { hanzi: "先准确再速度", pinyin: "xian zhun que zai su du" }
          ]
        }
      ]
    },
    {
      title: "第四章 · 句子与段落",
      lead: "从能打词，到能连续表达。",
      lessons: [
        {
          id: "zh-13",
          title: "中文短句",
          en: "Short Chinese Sentences",
          summary: "在完整句子里练习拼音、空格和标点节奏。",
          minutes: 14,
          difficulty: 3,
          focus: ["Space", "Punctuation"],
          goals: ["连续输入完整中文短句", "保持句子内部的拼音准确", "在标点处自然停顿"],
          sections: [
            {
              title: "句子练习看什么",
              html: "<p>短句练习不只看每个字的拼音，还要看整句的连贯性。打“今天也要认真练习打字”时，可以按“今天 / 也要 / 认真 / 练习 / 打字”分组。每组之间可以有一个极短的停顿，但不要停下来想下一个字怎么写。</p>"
            },
            {
              title: "常见漏键",
              html: "<p>句子里的高频错误通常不是生僻字，而是 <code>shi</code> 打成 <code>si</code>、<code>zhong</code> 漏掉 <code>h</code>、<code>lian</code> 漏掉 <code>n</code>。这些错误在单字练习里已经出现过，回到短句里要特别留意。</p>"
            },
            {
              title: "输入法实战",
              html: "<p>切换到输入法实战后，你需要真正用系统输入法打出这些句子。先保证选词正确，再追求速度。遇到候选不对，先检查拼音，不要盲目翻页。</p>"
            }
          ],
          type: "pinyin",
          items: [
            { hanzi: "今天也要认真练习打字。", pinyin: "jin tian ye yao ren zhen lian xi da zi" },
            { hanzi: "眼睛看屏幕，手指找键位。", pinyin: "yan jing kan ping mu shou zhi zhao jian wei" },
            { hanzi: "每一次敲击都要准确。", pinyin: "mei yi ci qiao ji dou yao zhun que" },
            { hanzi: "保持正确的手型。", pinyin: "bao chi zheng que de shou xing" },
            { hanzi: "速度来自准确的重复。", pinyin: "su du lai zi zhun que de chong fu" }
          ]
        },
        {
          id: "zh-14",
          title: "长句与标点",
          en: "Long Sentences and Punctuation",
          summary: "在长句中保持气息、拼音准确和标点选择。",
          minutes: 14,
          difficulty: 4,
          focus: [",", ".", "，", "。"],
          goals: ["完成较长中文句子的输入", "正确使用逗号与句号", "避免长句中的中途迷失"],
          sections: [
            {
              title: "长句先分组",
              html: "<p>长句不是一口气冲到底，而是由若干意群组成。例如：“练习时不要只盯着速度，而要看错误集中在哪里。”可以分成“练习时 / 不要只盯着速度 / 而要看错误 / 集中在哪里”。每组之间允许一次呼吸。</p>"
            },
            {
              title: "标点决定节奏",
              html: "<p>逗号是短停，句号是长停。输入中文标点时，确认输入法处于中文状态，否则会输出英文半角标点。写完后快速扫一眼，标点是否统一。</p>"
            },
            {
              title: "输入法状态检查",
              html: "<p>中英文混排时，最容易出现“中文句子里的英文逗号”。练习时留意状态栏，或者用输入法的“中文标点”开关锁定。写代码前再切回英文标点。</p>"
            }
          ],
          type: "pinyin",
          items: [
            { hanzi: "练习时不要只盯着速度，而要看错误集中在哪里。", pinyin: "lian xi shi bu yao zhi ding zhe su du er yao kan cuo wu ji zhong zai na li" },
            { hanzi: "如果手腕开始酸痛，就先停下来放松一下。", pinyin: "ru guo shou wan kai shi suan tong jiu xian ting xia lai fang song yi xia" },
            { hanzi: "学会盲打之后，你会发现输入变成了一件轻松的事。", pinyin: "xue hui mang da zhi hou ni hui fa xian shu ru bian cheng le yi jian qing song de shi" }
          ]
        },
        {
          id: "zh-15",
          title: "中文段落",
          en: "Chinese Paragraph",
          summary: "连续输入多句中文，练习耐力、标点和候选选择。",
          minutes: 16,
          difficulty: 4,
          focus: ["Space", "，", "。"],
          goals: ["连续完成 3–4 句中文", "保持整段标点统一", "在较长输入中控制错误率"],
          sections: [
            {
              title: "段落练习的策略",
              html: "<p>段落练习时，眼睛要比手指快半句。读完一个意群，手指跟上；不要一个字一个字地读。遇到不确定的字，先按当前读音输入，错了再改，不要停在原地反复想。</p>"
            },
            {
              title: "耐力和放松",
              html: "<p>连续输入几分钟后，如果手指开始僵硬，停下来活动一下手腕。耐力不是硬撑出来的，而是靠稳定的姿势和适当的休息积累的。</p>"
            },
            {
              title: "从练习到真实写作",
              html: "<p>最终目标不是“打完练习文本”，而是能在聊天、笔记、写作中自然地使用中文输入。把练习中的整词输入、标点习惯带到真实场景里，才算真正学会。</p>"
            }
          ],
          type: "pinyin",
          items: [
            { hanzi: "打字是一项可以训练的技能。", pinyin: "da zi shi yi xiang ke yi xun lian de ji neng" },
            { hanzi: "开始时慢一点没有关系，重要的是动作正确。", pinyin: "kai shi shi man yi dian mei you guan xi zhong yao de shi dong zuo zheng que" },
            { hanzi: "每天练习十分钟，比偶尔练两个小时更有效。", pinyin: "mei tian lian xi shi fen zhong bi ou er lian liang ge xiao shi geng you xiao" },
            { hanzi: "当输入不再打断思考，文字就会自然流动。", pinyin: "dang shu ru bu zai da duan si kao wen zi jiu hui zi ran liu dong" }
          ]
        }
      ]
    },
    {
      title: "第五章 · 综合测试",
      lead: "用一段完整中文，检验拼音、词语和标点。",
      lessons: [
        {
          id: "zh-16",
          title: "中文综合测试",
          en: "Chinese Final Test",
          summary: "混合单字、词语、成语和句子，完成一次完整中文输入测试。",
          minutes: 18,
          difficulty: 5,
          focus: ["Pinyin", "Punctuation"],
          goals: ["完成包含词语与句子的综合测试", "保持 95% 以上的准确率", "根据结果选择后续练习方向"],
          sections: [
            {
              title: "测试说明",
              html: "<p>本测试包含高频词、成语和完整句子。建议先用拼音模式完成一次，再用输入法实战完成一次。拼音模式看的是“敲得准不准”，输入法模式看的是“选得对不对”。</p>"
            },
            {
              title: "评分看什么",
              html: "<p>准确率低于 95%，回到易错音课程；拼音准确但选词慢，说明需要增加整词输入练习；速度慢但准确率高，可以开始做限时训练。</p>"
            },
            {
              title: "最后一次提醒",
              html: "<p>中文输入的速度，来自“拼音准确 + 选词果断 + 标点正确”。三者缺一不可。不要用翻页碰运气，先让拼音干净利落。</p>"
            }
          ],
          type: "pinyin",
          items: [
            { hanzi: "熟能生巧", pinyin: "shu neng sheng qiao" },
            { hanzi: "全神贯注", pinyin: "quan shen guan zhu" },
            { hanzi: "输入法", pinyin: "shu ru fa" },
            { hanzi: "键盘", pinyin: "jian pan" },
            { hanzi: "坚持每天练习，速度自然会提高。", pinyin: "jian chi mei tian lian xi su du zi ran hui ti gao" },
            { hanzi: "先保证准确，再追求速度。", pinyin: "xian bao zheng zhun que zai zhui qiu su du" }
          ]
        }
      ]
    }
  ]
});
