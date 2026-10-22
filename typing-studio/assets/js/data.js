/* 键艺 KeyCraft — 课程注册与数据工具 */
(function () {
  window.COURSES = [];
  window.LESSONS = {};
  window.COURSE_MAP = {};
  window.LESSON_MAP = {};

  window.registerCourse = function (course) {
    var lessonNo = 0;
    var all = [];
    course.chapters.forEach(function (chapter, ci) {
      chapter.courseId = course.id;
      chapter.index = ci + 1;
      chapter.lessons.forEach(function (lesson, li) {
        lessonNo += 1;
        lesson.courseId = course.id;
        lesson.courseName = course.name;
        lesson.courseCode = course.code;
        lesson.color = course.color;
        lesson.chapterTitle = chapter.title;
        lesson.chapterIndex = ci + 1;
        lesson.index = lessonNo;
        lesson.localIndex = li + 1;
        window.LESSONS[lesson.id] = lesson;
        window.LESSON_MAP[lesson.id] = lesson;
      });
      all = all.concat(chapter.lessons);
    });
    course.lessons = all;
    course.lessonCount = all.length;
    course.chapterCount = course.chapters.length;
    window.COURSES.push(course);
    window.COURSE_MAP[course.id] = course;
  };

  window.getLesson = function (id) {
    return window.LESSON_MAP[id] || window.LESSONS[id] || null;
  };

  window.getCourse = function (id) {
    return window.COURSE_MAP[id] || null;
  };

  window.getLessonNeighbors = function (lesson) {
    var course = lesson && lesson.courseId ? window.getCourse(lesson.courseId) : null;
    if (course && course.lessons && course.lessons.length) {
      var idx = course.lessons.indexOf(lesson);
      return {
        prev: idx > 0 ? course.lessons[idx - 1] : null,
        next: idx >= 0 && idx < course.lessons.length - 1 ? course.lessons[idx + 1] : null
      };
    }
    var list = window.LESSONS;
    var ids = Object.keys(list);
    var i = ids.indexOf(lesson ? lesson.id : "");
    return {
      prev: i > 0 ? list[ids[i - 1]] : null,
      next: i >= 0 && i < ids.length - 1 ? list[ids[i + 1]] : null
    };
  };

  window.getCourseLessons = function (courseId) {
    var c = window.getCourse(courseId);
    return c && c.lessons ? c.lessons : [];
  };

  var CN_NUM = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十",
    "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十",
    "二十一", "二十二", "二十三", "二十四", "二十五", "二十六", "二十七", "二十八", "二十九", "三十"];

  function decorateCourse(course) {
    var lessonNo = 0;
    var all = [];
    course.chapters.forEach(function (chapter, ci) {
      chapter.courseId = course.id;
      chapter.index = ci + 1;
      chapter.lessons.forEach(function (lesson, li) {
        lessonNo += 1;
        lesson.courseId = course.id;
        lesson.courseName = course.name;
        lesson.courseCode = course.code;
        lesson.color = course.color;
        lesson.chapterTitle = chapter.title;
        lesson.chapterIndex = ci + 1;
        lesson.index = lessonNo;
        lesson.localIndex = li + 1;
        window.LESSONS[lesson.id] = lesson;
        window.LESSON_MAP[lesson.id] = lesson;
      });
      all = all.concat(chapter.lessons);
    });
    course.lessons = all;
    course.lessonCount = all.length;
    course.chapterCount = course.chapters.length;
  }

  window.addChapters = function (courseId, chapters, position) {
    var course = window.getCourse(courseId);
    if (!course) throw new Error("Unknown course: " + courseId);
    var at = typeof position === "number" ? position : 0;
    chapters.forEach(function (chapter) {
      var name = String(chapter.title || "").replace(/^第[一二三四五六七八九十]+章\s*·\s*/, "");
      chapter.title = name;
      chapter.lessons.forEach(function (lesson) {
        if (window.LESSONS[lesson.id]) {
          throw new Error("Duplicate lesson id: " + lesson.id);
        }
      });
    });
    course.chapters.splice.apply(course.chapters, [at, 0].concat(chapters));
    course.chapters.forEach(function (chapter, ci) {
      var name = String(chapter.title || "").replace(/^第[一二三四五六七八九十]+章\s*·\s*/, "");
      chapter.title = "第" + (CN_NUM[ci] || (ci + 1)) + "章 · " + name;
    });
    decorateCourse(course);
    return course;
  };

  window.registerVirtualCourse = function (course) {
    course.virtual = true;
    course.lessons = course.lessons || [];
    course.chapters = course.chapters || [];
    course.chapterCount = course.chapters.length;
    course.lessonCount = course.lessons.length;
    window.COURSE_MAP[course.id] = course;
    return course;
  };

  window.registerVirtualLesson = function (lesson) {
    lesson.virtual = true;
    window.LESSONS[lesson.id] = lesson;
    window.LESSON_MAP[lesson.id] = lesson;
    var course = window.getCourse(lesson.courseId);
    if (course) {
      if (!course.lessons) course.lessons = [];
      var idx = course.lessons.findIndex(function (l) { return l.id === lesson.id; });
      if (idx < 0) course.lessons.push(lesson);
      course.lessonCount = course.lessons.length;
    }
    return lesson;
  };
})();
