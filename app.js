document.addEventListener('DOMContentLoaded', () => {
  const textarea = document.getElementById('result');
  const copyBtn = document.getElementById('copy-btn');
  const clearBtn = document.getElementById('clear-btn');
  const rosterInput = document.getElementById('roster-input');
  const rosterSubmitBtn = document.getElementById('roster-submit-btn');
  const saveRosterBtn = document.getElementById('save-roster-btn');
  const rosterClearBtn = document.getElementById('roster-clear-btn');
  const noStudentBtn = document.getElementById('no-student-btn');
  const studentList = document.getElementById('student-list');
  const profileSelect = document.getElementById('profile-select');
  const classSelect = document.getElementById('class-select');
  const EXCERPT_MAX_LENGTH = 100; // Maximum number of characters for excerpt display

  let feedbackData = {};
  let selectedStudent = '';
  let noStudentSelected = false;

  // Load the default profile
  loadProfile('demo');

  profileSelect.addEventListener('change', (e) => {
    loadProfile(e.target.value);
  });

  classSelect.addEventListener('change', (e) => {
    loadClassRoster(e.target.value);
  });

  function loadProfile(profileName) {
    fetch(`${profileName}.json`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load profile: ${profileName}`);
        }
        return response.json();
      })
      .then(data => {
        feedbackData = data;
        populateFeedbackPane(data);
      })
      .catch(error => {
        console.error('Error loading feedback items:', error);
      });
  }

  function loadClassRoster(className) {
    if (!className) return;
    fetch(`${className}.json`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load class roster: ${className}`);
        }
        return response.json();
      })
      .then(data => {
        populateStudentList(data.students);
      })
      .catch(error => {
        console.error('Error loading class roster:', error);
      });
  }

  function populateStudentList(students) {
    studentList.innerHTML = '';
    students.forEach(name => {
      const checkbox = document.createElement('input');
      checkbox.type = 'radio';
      checkbox.name = 'student';
      checkbox.value = name;
      checkbox.addEventListener('change', () => {
        const nameParts = name.split(' ');
        selectedStudent = nameParts.slice(-2).join(' ');
        updateFeedback();
      });

      const label = document.createElement('label');
      label.textContent = name;
      label.prepend(checkbox);

      studentList.appendChild(label);
      studentList.appendChild(document.createElement('br'));
    });
  }

  function populateFeedbackPane(data) {
    const feedbackPane = document.querySelector('.feedback-pane');
    const feedbackContent = document.createElement('div');
    feedbackContent.classList.add('feedback-content');
    feedbackContent.innerHTML = '<h2>Feedback Categories</h2>';

    for (const [category, types] of Object.entries(data)) {
      const feedbackGroup = document.createElement('div');
      feedbackGroup.classList.add('feedback-group');

      const fieldset = document.createElement('fieldset');
      const legend = document.createElement('legend');
      legend.textContent = category;
      fieldset.appendChild(legend);

      // Determine input type based on category
      const inputType = category === "Overall Feedback" ? "radio" : "checkbox";

      // Positive Feedback
      const positiveDiv = document.createElement('div');
      positiveDiv.classList.add('positive');
      types.positive.forEach((item, index) => {
        const label = createFeedbackLabel(item.content, item.label, item.excerpt, category, 'positive', index, inputType);
        positiveDiv.appendChild(label);
      });
      fieldset.appendChild(positiveDiv);

      // Negative Feedback
      const negativeDiv = document.createElement('div');
      negativeDiv.classList.add('negative');
      types.negative.forEach((item, index) => {
        const label = createFeedbackLabel(item.content, item.label, item.excerpt, category, 'negative', index, inputType);
        negativeDiv.appendChild(label);
      });
      fieldset.appendChild(negativeDiv);

      feedbackGroup.appendChild(fieldset);

      const addPositiveBtn = createAddButton(category, 'positive');
      addPositiveBtn.classList.add('positive');
      feedbackGroup.appendChild(addPositiveBtn);

      const addNegativeBtn = createAddButton(category, 'negative');
      addNegativeBtn.classList.add('negative');
      feedbackGroup.appendChild(addNegativeBtn);

      feedbackContent.appendChild(feedbackGroup);
    }

    feedbackPane.innerHTML = ''; // Clear existing content
    feedbackPane.appendChild(profileSelect); // Re-attach the profile select menu
    feedbackPane.appendChild(feedbackContent); // Add the new feedback content

    const checkboxes = document.querySelectorAll('input[type="checkbox"], input[type="radio"]');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const previousText = textarea.value;
        updateFeedback();
        copyToClipboard();
        highlightNewText(previousText);
      });
    });
  }

  function createFeedbackLabel(content, labelText, excerpt, category, type, index, inputType = "checkbox") {
    const label = document.createElement('label');
    label.title = content;

    const input = document.createElement('input');
    input.type = inputType;
    input.name = category === "Overall Feedback" ? "overall-feedback" : ""; // Ensure radio buttons are grouped
    input.dataset.feedback = content.trim();
    label.appendChild(input);

    const labelSpan = document.createElement('span');
    labelSpan.textContent = labelText;
    label.appendChild(labelSpan);

    const excerptSpan = document.createElement('span');
    excerptSpan.classList.add('excerpt');
    const excerptText = content.trim();
    excerptSpan.textContent = excerptText.length > EXCERPT_MAX_LENGTH ? excerptText.substring(0, EXCERPT_MAX_LENGTH) + '...' : excerptText;
    label.appendChild(excerptSpan);

    const editBtn = document.createElement('button');
    editBtn.innerHTML = '✏️'; // Pencil icon
    editBtn.classList.add('edit-btn');
    editBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleInlineEdit(label, category, type, index);
    });
    label.appendChild(editBtn);

    return label;
  }

  function createAddButton(category, type) {
    const addBtn = document.createElement('button');
    addBtn.innerHTML = '➕'; // Plus icon
    addBtn.classList.add('add-btn');
    addBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleInlineAdd(addBtn, category, type);
    });
    return addBtn;
  }

  function toggleInlineEdit(label, category, type, index) {
    const item = feedbackData[category][type][index];
    const contentInput = document.createElement('input');
    contentInput.type = 'text';
    contentInput.value = item.content;
    contentInput.classList.add('inline-edit');

    const labelInput = document.createElement('input');
    labelInput.type = 'text';
    labelInput.value = item.label;
    labelInput.classList.add('inline-edit');

    const excerptInput = document.createElement('input');
    excerptInput.type = 'text';
    excerptInput.value = item.excerpt;
    excerptInput.classList.add('inline-edit');

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.classList.add('save-btn');
    saveBtn.addEventListener('click', () => {
      item.content = contentInput.value;
      item.label = labelInput.value;
      item.excerpt = excerptInput.value;
      saveFeedbackData();
      populateFeedbackPane(feedbackData);
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.classList.add('cancel-btn');
    cancelBtn.addEventListener('click', () => {
      populateFeedbackPane(feedbackData);
    });

    label.innerHTML = '';
    label.appendChild(contentInput);
    label.appendChild(labelInput);
    label.appendChild(excerptInput);
    label.appendChild(saveBtn);
    label.appendChild(cancelBtn);
  }

  function toggleInlineAdd(addBtn, category, type) {
    const contentInput = document.createElement('input');
    contentInput.type = 'text';
    contentInput.placeholder = 'New Feedback Content';
    contentInput.classList.add('inline-edit');

    const labelInput = document.createElement('input');
    labelInput.type = 'text';
    labelInput.placeholder = 'New Feedback Label';
    labelInput.classList.add('inline-edit');

    const excerptInput = document.createElement('input');
    excerptInput.type = 'text';
    excerptInput.placeholder = 'New Feedback Excerpt';
    excerptInput.classList.add('inline-edit');

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Add';
    saveBtn.classList.add('save-btn');
    saveBtn.addEventListener('click', () => {
      if (contentInput.value && labelInput.value && excerptInput.value) {
        feedbackData[category][type].push({
          content: contentInput.value,
          label: labelInput.value,
          excerpt: excerptInput.value.substring(0, EXCERPT_MAX_LENGTH) + '...'
        });
        saveFeedbackData();
        populateFeedbackPane(feedbackData);
      }
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.classList.add('cancel-btn');
    cancelBtn.addEventListener('click', () => {
      addContainer.remove();
      addBtn.style.display = 'inline-block';
    });

    const addContainer = document.createElement('div');
    addContainer.classList.add('add-container');
    addContainer.appendChild(contentInput);
    addContainer.appendChild(labelInput);
    addContainer.appendChild(excerptInput);
    addContainer.appendChild(saveBtn);
    addContainer.appendChild(cancelBtn);

    addBtn.parentElement.insertBefore(addContainer, addBtn);
    addBtn.style.display = 'none';
  }

  function saveFeedbackData() {
    fetch('feedbackItems.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(feedbackData)
    }).catch(error => {
      console.error('Error saving feedback items:', error);
    });
  }

  function updateFeedback() {
    const feedbackByCategory = {};
    const checkboxes = document.querySelectorAll('input[type="checkbox"], input[type="radio"]');

    checkboxes.forEach(checkbox => {
      if (checkbox.checked) {
        const fieldset = checkbox.closest('fieldset');
        if (fieldset) {
          const legend = fieldset.querySelector('legend');
          if (legend) {
            const category = legend.textContent;
            if (!feedbackByCategory[category]) {
              feedbackByCategory[category] = [];
            }
            feedbackByCategory[category].push(checkbox.dataset.feedback);
          }
        }
      }
    });

    let compiledText = '';
    if (!noStudentSelected && selectedStudent) {
      compiledText += `Dear ${selectedStudent},\n`;
    }
    for (const [category, feedbacks] of Object.entries(feedbackByCategory)) {
      compiledText += `\n**${category}**\n`; // Add line breaks before each category
      feedbacks.forEach(feedback => {
        compiledText += `- ${feedback}\n\n`; // Add a new line before and after each feedback item
      });
    }

    textarea.value = compiledText.trim(); // Remove any trailing newlines
  }

  function highlightNewText(previousText) {
    const newText = textarea.value;
    const diff = findDiff(previousText, newText);
    if (diff) {
      textarea.setSelectionRange(diff.start, diff.end);
      textarea.focus(); // Ensure the textarea is focused to show the selection
    }
  }

  function findDiff(oldText, newText) {
    let start = 0;
    while (start < oldText.length && oldText[start] === newText[start]) {
      start++;
    }

    let endOld = oldText.length - 1;
    let endNew = newText.length - 1;
    while (endOld >= start && endNew >= start && oldText[endOld] === newText[endNew]) {
      endOld--;
      endNew--;
    }

    return { start, end: endNew + 1 };
  }

  function copyToClipboard() {
    textarea.select();
    document.execCommand('copy');
    window.getSelection().removeAllRanges(); // Deselect the text
  }

  copyBtn.addEventListener('click', () => {
    textarea.select();
    document.execCommand('copy');
    window.getSelection().removeAllRanges(); // Deselect the text
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyBtn.textContent = 'Copy to Clipboard';
    }, 2000);
  });

  clearBtn.addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('input[type="checkbox"], input[type="radio"]');
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
    textarea.value = '';
  });

  rosterSubmitBtn.addEventListener('click', () => {
    const rosterText = rosterInput.value.trim();
    const names = rosterText.split('\n').map(name => name.trim()).filter(name => name);
    populateStudentList(names);
  });

  saveRosterBtn.addEventListener('click', () => {
    const rosterText = rosterInput.value.trim();
    if (!rosterText) {
      alert('Please enter a roster to save.');
      return;
    }
    const filename = prompt('Enter a filename for the roster:');
    if (filename) {
      saveRosterToFile(filename, rosterText.split('\n').map(name => name.trim()).filter(name => name));
    }
  });

  function saveRosterToFile(filename, students) {
    const data = JSON.stringify({ students }, null, 2);
    fetch(`${filename}.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: data
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to save roster');
      }
      alert('Roster saved successfully!');
      updateClassSelect(filename);
    })
    .catch(error => {
      console.error('Error saving roster:', error);
    });
  }

  function updateClassSelect(filename) {
    const option = document.createElement('option');
    option.value = filename;
    option.textContent = filename.charAt(0).toUpperCase() + filename.slice(1);
    classSelect.appendChild(option);
  }

  rosterClearBtn.addEventListener('click', () => {
    rosterInput.value = '';
    studentList.innerHTML = '';
    selectedStudent = '';
    updateFeedback();
  });

  noStudentBtn.addEventListener('click', () => {
    noStudentSelected = !noStudentSelected;
    noStudentBtn.textContent = noStudentSelected ? 'Enable Student Selection' : 'No Student';
    updateFeedback();
  });

  // Add event listeners for sample students
  const sampleStudents = document.querySelectorAll('#student-list input[type="radio"]');
  sampleStudents.forEach(student => {
    student.addEventListener('change', () => {
      const nameParts = student.value.split(' ');
      selectedStudent = nameParts.slice(-2).join(' ');
      updateFeedback();
    });
  });
});
