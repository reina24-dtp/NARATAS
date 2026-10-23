DROP TABLE IF EXISTS attendances, meetings, enrollments, students, classes CASCADE;

CREATE TABLE classes (
  id          SERIAL PRIMARY KEY,
  course_name VARCHAR(100) NOT NULL,
  class_name  VARCHAR(50)  NOT NULL,
  lecturer    VARCHAR(100) NOT NULL
);

CREATE TABLE students (
  id   SERIAL PRIMARY KEY,
  nim  VARCHAR(20)  NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE enrollments (
  id         SERIAL PRIMARY KEY,
  class_id   INT NOT NULL REFERENCES classes(id)  ON DELETE CASCADE,
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE (class_id, student_id)
);

CREATE TABLE meetings (
  id             SERIAL PRIMARY KEY,
  class_id       INT  NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  meeting_number INT  NOT NULL CHECK (meeting_number > 0),
  meeting_date   DATE NOT NULL,
  UNIQUE (class_id, meeting_number)
);

CREATE TABLE attendances (
  id         SERIAL PRIMARY KEY,
  meeting_id INT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status     VARCHAR(10) NOT NULL
             CHECK (status IN ('hadir','izin','sakit','alpa')),
  UNIQUE (meeting_id, student_id)
);