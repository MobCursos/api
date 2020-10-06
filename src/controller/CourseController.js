const Course = require("../model/Course");
const User = require("../model/User");

exports.list = (req, res) => {
  Course.find((err, courses) => {
    if (err) {
      res.status(500).send({ msg: err });
      return console.error(err);
    }
    res.json(courses);
  });
};

// get by _id
exports.get_by_id = (req, res) => {
  Course.findOne({ _id: req.params.id }, (err, course) => {
    if (course) {
      res.json(course);
    } else {
      res.sendStatus(404);
    }
  });
};

// add
exports.add = (req, res) => {
  const teacherId = req.userId;
  req.body.teacher_id = teacherId;
  const newCourse = new Course(req.body);
  newCourse.save((err, course) => {
    if (err) {
      res.status(500).send(err)
    } else {
      res.send(course)
    }
  })
};

//alter
exports.alter = (req, res) => {
  let id = req.params.id;
  let courseAlter = req.body;
  Course.findOneAndUpdate(
    { _id: id },
    courseAlter,
    { new: true },
    (err, courseActual) => {
      if (err) {
        res.send(err);
      }
      res.json(courseActual);
    }
  );
};

exports.remove = (req, res) => {
  const id = req.params.id;
  Course.findOneAndDelete({ _id: id }, (err, course) => {
    // TODO: handle err
    if (err) {
      console.log(err);
    } else if (course === null) {
      res.sendStatus(404);
    } else {
      res.json(course);
    }
  });
};

exports.search = (req, res, next) => {
  if (req.query && req.query.name){
      const paramName = req.query.name;
      Course.find({name: paramName}, (err, courses) => {
          if(err){
              res.status(500).send(err);
          }
          res.json(courses);
      });
  }
}

// todo: utilizar dados db e pesquisar pelo db
exports.subscribe = async function(req, res) {
  const studentId = req.userId
  const courseId = req.body.courseId

  // (fazer em etapa anterior, no crud cursos)
  // pesquisar cursos (somente cursos em que aluno não está matriculado)

  let subscribed = await isStudentSubscribed(courseId, studentId)

  if ( subscribed ) {
    return res.status(500).send('Student already subscribed on this course.')
  }
  // tratar possivel erro em uma das operacoes ou ambas
  const updateStudentId = { $push: { students: studentId }};
  Course.findByIdAndUpdate( 
    courseId,
    updateStudentId,
    { new: true },
    (err, courseActual) => {
      if (err) {
        return res.status(500).send(err)
      } else {
        res.json(courseActual)
      }
  });
  const updateCourseId = { $push: { courses: courseId }};
  User.findByIdAndUpdate( 
    studentId,
    updateCourseId,
    { new: true },
    (err, userActual) => {
      if (err) {
        // deve desfazer a operação anterior (usar transaction?)
        return res.status(500).send(err)
      } else {
        //res.json(userActual)
      }
  });
};

// todo: utilizar dados db e pesquisar pelo db
exports.unsubscribe = async function(req, res) {
  const studentId = req.userId
  const courseId = req.body.courseId

  // (fazer em etapa anterior, no crud cursos)
  // pesquisar cursos (somente cursos em que aluno não está matriculado)

  let subscribed = await isStudentSubscribed(courseId, studentId)

  if ( !subscribed ) {
    return res.status(500).send('Student not subscribed on this course.')
  }
  // tratar possivel erro em uma das operacoes ou ambas
  const updateStudentId = { $pull: { students: studentId }};
  Course.findByIdAndUpdate( 
    courseId,
    updateStudentId,
    { new: true },
    (err, courseActual) => {
      if (err) {
        return res.status(500).send(err)
      } else {
        res.json(courseActual)
      }
  });
  const updateCourseId = { $pull: { courses: courseId }};
  User.findByIdAndUpdate( 
    studentId,
    updateCourseId,
    { new: true },
    (err, userActual) => {
      if (err) {
        // deve desfazer a operação anterior (usar transaction?)
        return res.status(500).send(err)
      } else {
        //res.json(userActual)
      }
  });
};

async function isStudentSubscribed( courseId, studentId ) {
  const course = await Course.findById( courseId, (err, course) => {
    if (err) {
      throw new Exception(err)
    } else {
      return course
    }
  });
  // console.log(course)
  let subscribed = new Promise(

    function(resolve, reject) {
      let value = false
      let i = 0
      let studentsIdArray = course.students
      while ( !value && i < studentsIdArray.length ) {
        if ( studentsIdArray[i] == studentId ) {
          value = true
          //resolve(value)
        }
        i++
      }
      resolve(value)
    } 
  )
  return subscribed
};
