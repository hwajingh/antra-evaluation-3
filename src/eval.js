import { Api } from "./api/api.js";

const View = (() => {
  //-------map html id to JS keys
  const domstr = {
    availableCourses: "#availableCourses",
    selectedCourses: "#selectedCourses",
    course: ".course",
    totalCredit: "#totalCredit",
    select: "#select",
  };
  // set tmp as ele's content
  const render = (ele, tmp) => {
    ele.innerHTML = tmp;
  };

  //set background of element based on whetherr it is selected or not and if it is an odd child of the list or not
  const setBackground = (element, isSelected, isOdd) => {
    const originalColor = isOdd ? "white" : "rgb(221, 239, 221)";
    element.style.backgroundColor = isSelected ? "deepskyblue" : originalColor;
  };

  // return tmp as a string of all elements in arr/ browser then renders it as li items
  const createTmp = (arr) => {
    let tmp = "";

    arr.forEach((course) => {
      let typeOfCourse = course.required ? "Compulsory" : "Elective";
      tmp += `
        <li class="course" id="${course.courseId}">
          <span>${course.courseName}</span>
          <span>Course Type: ${typeOfCourse}</span>
          <span>Course Credit: ${course.credit}</span>
        </li>
      `;
    });
    return tmp;
  };

  return {
    render,
    domstr,
    createTmp,
    setBackground,
  };
})();

// MODEL Immediately-invoked function expression. IIFE
const Model = ((api, view) => {
  //destructure object API
  const { getCourses, deleteCourse } = api;

  class Course {
    constructor(id, name, required, credit) {
      this.id = id;
      this.courseName = name;
      this.required = required;
      this.credit = credit;
    }
  }

  class State {
    #availableCourses = [];
    // user selected courses holder
    #tempCourses = [];
    #selectedCourses = [];
    #totalCredit = 0;

    get availableCourses() {
      return this.#availableCourses;
    }

    get tempCourses() {
      return this.#tempCourses;
    }

    get selectedCourses() {
      return this.#selectedCourses;
    }

    set availableCourses(newlist) {
      this.#availableCourses = [...newlist];

      // render list into available courses

      // selects availableCourses from domcument and store in availableContainer
      const availableContainer = document.querySelector(
        view.domstr.availableCourses
      );

      // use createTmp func in view to create a list of available courses in
      // a single string and store temp as currently availablecontainer
      const tmp = view.createTmp(this.#availableCourses);

      // put list into innerhtml
      view.render(availableContainer, tmp);
    }

    set selectedCourses(newlist) {
      this.#selectedCourses = [...newlist];
      // render list into selected courses []
      const selectedContainer = document.querySelector(
        view.domstr.selectedCourses
      );
      const tmp = view.createTmp(this.#selectedCourses);
      view.render(selectedContainer, tmp);
    }

    // Dont need to render to user
    set tempCourses(newlist) {
      this.#tempCourses = [...newlist];
    }

    setTotalCredit(credit) {
      this.#totalCredit = credit;
      const creditText = document.querySelector(view.domstr.totalCredit);

      view.render(creditText, this.#totalCredit);
    }

    setElementBackground(element, isSelected, isOdd) {
      view.setBackground(element, isSelected, isOdd);
    }
  }

  return { getCourses, deleteCourse, State, Course };

  //input
})(Api, View);

//controller
const Controller = ((model, view) => {
  const state = new model.State();

  const setDefaultCredit = () => {
    state.setTotalCredit(0);
  };

  const addToSelected = () => {
    // map select button id to selectButton
    const selectButton = document.querySelector(view.domstr.select);

    selectButton.addEventListener("click", () => {
      //changes datastructure of available Courses from array to object
      // O(n) -> O(1)
      const courseMap = state.availableCourses.reduce((acc, curr) => {
        //key is courseID and curr is course
        acc[curr.courseId] = curr;
        return acc;
      }, {});

      // add up selected temp course credits
      const credits = state.tempCourses.reduce((acc, curr) => {
        acc += courseMap[curr.id].credit;
        return acc;
      }, 0);

      let text =
        "You have chosen " +
        credits +
        " credits for this semester. You cannot change once you submit. Do you want to confirm?";
      if (confirm(text) == true) {
        const coursesToAdd = state.tempCourses;
        state.selectedCourses = coursesToAdd;
        state.tempCourses = [];
        selectButton.disabled = true;
      } else {
        text = "You canceled!";
      }
    });
  };

  const addCourseSelectEvent = () => {
    const availableContainer = document.querySelector(
      view.domstr.availableCourses
    );
    availableContainer.addEventListener("click", (event) => {
      // check if selected item is a course of class course
      if (event.target.className === "course") {
        // ------- INITIALIZE HELPER AND DATA --------
        const courseMap = state.availableCourses.reduce((acc, curr) => {
          acc[curr.courseId] = curr;
          return acc;
        }, {});
        const chosenId = parseInt(event.target.id);

        //destructure chosen course with the given chosen id
        const { courseId, courseName, required, credit } = courseMap[chosenId];

        // ------- CALCULATE THE COURSE CREDIT --------
        const credits = state.tempCourses.reduce((acc, curr) => {
          acc += courseMap[curr.id].credit;
          return acc;
        }, 0);

        if (credits + credit > 18) {
          alert("You can only choose up to 18 credits in one semester");
          return;
        }

        // ------- create a chosen course --------
        const course = new model.Course(courseId, courseName, required, credit);

        // ------- PUT THE COURSE IN THE STATE & STYLE BACKGROUND --------
        // filter returns a array of the duplicated selected course
        const isCourseIncluded =
          state.tempCourses.filter((course) => course.id === chosenId).length >
          0;

        // uses unique id assigned to said element to set background of element
        // id uses the same as course id
        // set in li element createtmp
        const element = document.getElementById(chosenId);
        state.setElementBackground(element, !isCourseIncluded, chosenId % 2);

        if (isCourseIncluded) {
          // if course is included in tmp courses then check if it is the same as selected course
          // if not filter out
          const newCourses = state.tempCourses.filter(
            (course) => course.id !== chosenId
          );
          state.tempCourses = [...newCourses];
        } else {
          // put new course to first element if it is not present
          state.tempCourses = [course, ...state.tempCourses];
        }

        state.setTotalCredit(credits + credit);
      }
    });
  };

  const init = () => {
    model.getCourses().then((courses) => {
      state.availableCourses = courses;
    });
  };

  const bootstrap = () => {
    init();
    addCourseSelectEvent();
    addToSelected();
    setDefaultCredit();
  };

  return { bootstrap };
})(Model, View);

Controller.bootstrap();
