const userData = JSON.parse(localStorage.getItem('userData'));

    console.log(userData);
    if (!userData) {
        setTimeout(() => {
            document.getElementById("background-light").style.display = "flex";
            loginContainer.classList.add('show');
        }, 2000);
    }

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}
function getStatusClass(percentage) {
    if (percentage === 100) return 'status-completed';
    if (percentage >= 80) return 'status-almost';
    if (percentage >= 50) return 'status-progress';
    return 'status-started';
}

function getStatusText(percentage) {
    if (percentage === 100) return 'Completed';
    if (percentage >= 80) return 'Almost Completed';
    if (percentage >= 50) return 'In Progress';
    return 'Just Started';
}
if(!userData){
    const topicCards = document.getElementById('topicCards');
    topicCards.innerHTML = '';
    const emptyStateHtml = `
        <div class="empty-state">
            <p>No topics added yet. Click the "Add Topic" button to get started!</p>
        </div>
    `;
    topicCards.innerHTML = emptyStateHtml;
}
async function loadTopics() {
    try {
        const response = await fetch(`/topics/${userData.id}`, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const { success, data } = await response.json();
        
        if (!success) throw new Error('Invalid response structure');
        
        const topicCards = document.getElementById('topicCards');
        topicCards.innerHTML = '';
        
        if (!data || data.length === 0) {
            const emptyStateHtml = `
                <div class="empty-state">
                    <div class="empty-state-content">
                        <i class="fas fa-ghost" style="font-size: 4rem; color: var(--primary); margin-bottom: 1rem;"></i>
                        <h3 style="color: #4A5568; margin-bottom: 0.5rem;">No Topics Found</h3>
                        <p style="color: #718096; margin-bottom: 1.5rem;">Ready to start your learning journey?</p>
                        <div class="suggested-topics">
                            <p style="font-weight: 500; margin-bottom: 1rem;">Suggested topics to get started:</p>
                            <div class="topic-grid">
                                <div class="suggested-topic">
                                    <i class="fas fa-code"></i>
                                    <span>Arrays & Strings</span>
                                </div>
                                <div class="suggested-topic">
                                    <i class="fas fa-project-diagram"></i>
                                    <span>Linked Lists</span>
                                </div>
                                <div class="suggested-topic">
                                    <i class="fas fa-tree"></i>
                                    <span>Trees & Graphs</span>
                                </div>
                                <div class="suggested-topic">
                                    <i class="fas fa-sort-amount-down"></i>
                                    <span>Sorting & Searching</span>
                                </div>
                            </div>
                        </div>
                         <button class="btn btn-primary" onclick="toggleModal('addTopicModal')">
                    <i class="fas fa-folder-plus"></i>
                    New Topic
                </button>
                    </div>
                </div>
            `;
            topicCards.innerHTML = emptyStateHtml;
            return;
        }
        
        data.forEach(topic => {
            const progressPercentage = (topic.problems_solved / topic.total_problems) * 100;
            const statusClass = getStatusClass(progressPercentage);
            const statusText = getStatusText(progressPercentage);
            
            const cardHtml = `
                <div class="topic-card" data-topic-id="${topic.id}">
                    <div class="topic-header">
                        <h3 class="topic-title">${topic.name}</h3>
                        <button class="update-btn" onclick="updateTopic(${topic.id})">

                            <i class="fas fa-edit"></i>
                            update here
                        </button>
                    </div>
                    <div>${topic.problems_solved}/${topic.total_problems} problems solved</div>
                    <div class="topic-status ${statusClass}">Status: ${statusText}</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                    </div>
                    <div class="difficulty-badges">
                        <span class="badge badge-easy">Easy: ${topic.easy}</span>
                        <span class="badge badge-medium">Medium: ${topic.medium}</span>
                        <span class="badge badge-hard">Hard: ${topic.hard}</span>
                    </div>
                    <div class="date-info">
                        <i class="far fa-calendar-alt"></i> Target: ${formatDate(topic.target_date)}
                    </div>
                </div>
            `;
            
            topicCards.insertAdjacentHTML('beforeend', cardHtml);
        });
    } catch (error) {
        console.error('Error loading topics:', error);
        
        const topicCards = document.getElementById('topicCards');
        topicCards.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-circle" style="font-size: 2rem; color: #E53E3E; margin-bottom: 1rem;"></i>
                <p style="color: #E53E3E;">Unable to load topics. Please try again later.</p>
                <button class="retry-btn" onclick="loadTopics()">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    }
}
function toggleModal(modalId) {
    document.getElementById(modalId).classList.toggle('show');
}


    loadTopics()

function remove(){
    const modal = document.getElementById('updateProgressModal');
    modal.style.display = 'none';
}
//--------------------------form
document.getElementById('addTopicForm').onsubmit = async (e) => {
    e.preventDefault();  // Prevent default form submission

    const formData = new FormData(e.target);

    // Retrieve each input's value using its 'name' attribute
    const topicName = formData.get('topicName');
    const targetProblems = parseInt(formData.get('targetProblems'));  // Ensure it's an integer
    const targetDate = formData.get('targetDate');  // Should be in the format YYYY-MM-DD
    e.target.reset();
    // Prepare the data object to send to the backend
    const topicData = {
        name: topicName,
        total_problems: targetProblems,
        target_date: targetDate
    };

    try {
        // Send data to the backend via a POST request
        console.log(userData.id);
        const response = await fetch(`newtopic/${userData.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(topicData), // Convert topicData to JSON
        });

        const responseData = await response.json();

        // Handle the response
        if (responseData.success) {
            alert('Topic added successfully!');
            loadTopics();
            loadStats();
            // Optionally, reload topics or reset the form here
        } else {
            alert('Failed to add topic: ' + responseData.message);
            
        }
    } catch (error) {
        console.error('Error adding topic:', error);
        alert('Error adding topic');
    }
    const modal = document.getElementById('addTopicModal'); // Make sure the modal ID is correct
    modal.classList.remove('show');
};

function updateSummary() {
    const easy = parseInt(document.querySelector('input[name="easySolved"]').value) || 0;
    const medium = parseInt(document.querySelector('input[name="mediumSolved"]').value) || 0;
    const hard = parseInt(document.querySelector('input[name="hardSolved"]').value) || 0;
    const total = easy + medium + hard;

    // Update summary text
    const summaryDiv = document.getElementById('updateSummary');
    const totalProblemsElement = document.getElementById('totalProblems');

    if (summaryDiv && totalProblemsElement) {
        totalProblemsElement.textContent = `Total problems to add: ${total}`;

        // Show or hide the summary div based on input
        if (total > 0) {
            summaryDiv.style.display = 'block';
        } else {
            summaryDiv.style.display = 'none';
        }
    }
}

// Attach event listeners to inputs
const problemInputs = document.querySelectorAll('.problem-input');
problemInputs.forEach(input => {
    input.addEventListener('input', updateSummary);
});


// Function to get the values of Easy, Medium, and Hard Problems
function getProblemValues() {
    // Get values from the input fields
    const easy = parseInt(document.querySelector('input[name="easySolved"]').value) || 0;
    const medium = parseInt(document.querySelector('input[name="mediumSolved"]').value) || 0;
    const hard = parseInt(document.querySelector('input[name="hardSolved"]').value) || 0;

    // Return the values
    return { easy, medium, hard };
}
function updateTopic(topicId) {
    // Get the form and modal elements
    const form = document.getElementById('updateProgressForm');
    const modal = document.getElementById('updateProgressModal');
    
    // Reset the form values immediately when opening
    form.reset();
    
    // Reset all number inputs to 0 explicitly
    const inputs = form.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.value = '0';
    });

    // Reset the summary display
    const summaryDiv = document.getElementById('updateSummary');
    summaryDiv.style.display = 'none';
    document.getElementById('totalProblems').textContent = 'Total problems to add: 0';
    
    // Show the modal
    modal.style.display = 'flex';
    
    // Remove old event listeners and attach new one
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    // Re-attach the input event listeners for the summary update
    const problemInputs = newForm.querySelectorAll('.problem-input');
    problemInputs.forEach(input => {
        input.addEventListener('input', updateSummary);
    });
    
    newForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const easy = parseInt(newForm.querySelector('input[name="easySolved"]').value) || 0;
        const medium = parseInt(newForm.querySelector('input[name="mediumSolved"]').value) || 0;
        const hard = parseInt(newForm.querySelector('input[name="hardSolved"]').value) || 0;
        const userid=userData.id
        // Reset form and hide modal
        newForm.reset();
        modal.style.display = 'none';
        
        // Make the API call
        fetch(`/progress/update/${topicId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ easy, medium, hard, userid}),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                updateTopicCard(data.updatedTopic, topicId);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            // Optionally add user feedback here
            alert('Failed to update progress. Please try again.');
        });
    });
}
function updateTopicCard(updatedTopic, topicId) {
    const topicCard = document.querySelector(`.topic-card[data-topic-id="${topicId}"]`);
    if (!topicCard) return;
    
    topicCard.querySelector('div:nth-child(2)').textContent = 
        `${updatedTopic.problems_solved}/${updatedTopic.total_problems} problems solved`;
        
    const statusText = getStatusText(updatedTopic.problems_solved, updatedTopic.total_problems);
    const statusClass = getStatusClass(updatedTopic.problems_solved, updatedTopic.total_problems);
    const statusDiv = topicCard.querySelector('.topic-status');
    statusDiv.className = `topic-status ${statusClass}`;
    statusDiv.textContent = `Status: ${statusText}`;
    
    const progressPercentage = (updatedTopic.problems_solved / updatedTopic.total_problems) * 100;
    topicCard.querySelector('.progress-fill').style.width = `${progressPercentage}%`;
    
    topicCard.querySelector('.badge-easy').textContent = `Easy: ${updatedTopic.easy}`;
    topicCard.querySelector('.badge-medium').textContent = `Medium: ${updatedTopic.medium}`;
    topicCard.querySelector('.badge-hard').textContent = `Hard: ${updatedTopic.hard}`;
    loadStats()
}
function toggleModal(modalId) {
    document.getElementById(modalId).classList.toggle('show');
}
async function loadStats() {
    try {
        const response = await fetch(`/stats/${userData.id}`);
        if (!response.ok) throw new Error('Failed to fetch stats');

        const data = await response.json();

        // Ensure data properties have default values if they are missing
        const activeTopics = data.activeTopics ?? 0;
        const problemsSolved = data.problemsSolved ?? 0;
        const totalProblems = data.totalProblems ?? 0;
        const successRate = data.successRate ?? 0;

        // Update the DOM with the fetched or default values
        document.querySelector('.stat-card:nth-child(1) .stat-value').textContent = activeTopics;
        document.querySelector('.stat-card:nth-child(2) .stat-value').textContent = `${problemsSolved}/${totalProblems}`;
        document.querySelector('.stat-card:nth-child(3) .stat-value').textContent = `${successRate}%`;
    } catch (error) {
        console.error('Error loading stats:', error);

        // Set default values in case of an error
        document.querySelector('.stat-card:nth-child(1) .stat-value').textContent = 0;
        document.querySelector('.stat-card:nth-child(2) .stat-value').textContent = '0/0';
        document.querySelector('.stat-card:nth-child(3) .stat-value').textContent = '0%';
    }
}


// Call loadStats after the DOM loads
document.addEventListener('DOMContentLoaded', loadStats);


const dataStructures = [
    'Arrays & Strings',
    'Linked Lists',
    'Stacks',
    'Queues',
    'Trees',
    'Graphs',
    'Hash Tables',
    'Heaps'
];

const algorithms = [
'Sorting',
'Searching',
'Recursion',
'Backtracking',
'Greedy Algorithms',
'Divide and Conquer',
'Dynamic Pro..',
'Sliding Window',
'Two Pointer Techn..',
'KMP Algorithm',
'Dijkstra’s Algo',
'Floyd-Warshall Algo',
'Prim’s Algo',
'Kruskal’s Algo',
'Bellman-Ford Algo',
'A* Search Algo',
'(BFS) / (DFS)',
'Topological Sort',
'Union-Find / Disjoint Set',
'Fibo / Matrix'
];

document.addEventListener('DOMContentLoaded', () => {
    const dataStructuresGrid = document.getElementById('dataStructuresGrid');
    const algorithmsGrid = document.getElementById('algorithmsGrid');

    // Function to create concept boxes
    const createConceptBox = (concept, parentGrid) => {
        const conceptBox = document.createElement('div');
        conceptBox.className = 'concept-box';

        const conceptName = document.createElement('div');
        conceptName.className = 'concept-name';

        const dot = document.createElement('div');
        dot.className = 'dot';

        conceptName.appendChild(dot);
        conceptName.appendChild(document.createTextNode(concept));

        conceptBox.appendChild(conceptName);
        parentGrid.appendChild(conceptBox);
    };

    // Add Data Structures
    dataStructures.forEach(structure => {
        createConceptBox(structure, dataStructuresGrid);
    });

    // Add Algorithms
    algorithms.forEach(algorithm => {
        createConceptBox(algorithm, algorithmsGrid);
    });
});

/*const streakCountNav = document.getElementById('streakCountNav');
const decrementBtnNav = document.getElementById('decrementBtnNav');
const incrementBtnNav = document.getElementById('incrementBtnNav');

// Initialize streak count from localStorage or default to 0
let currentStreak = parseInt(localStorage.getItem('streak')) || 0;

// Function to update streak display and button states
function updateStreakDisplay() {
    // Update streak number display
    streakCountNav.textContent = currentStreak;
    
    // Update decrement button state
    decrementBtnNav.disabled = currentStreak === 0;
    
    // Save to localStorage
    localStorage.setItem('streak', currentStreak.toString());

    // Optional: Add animation class to fire icon when streak increases
    const fireIcon = document.querySelector('.fa-fire');
    fireIcon.classList.remove('pulse');
    void fireIcon.offsetWidth; // Trigger reflow
    fireIcon.classList.add('pulse');
}

// Add click event listeners
incrementBtnNav.addEventListener('click', () => {
    currentStreak++;
    updateStreakDisplay();
});

decrementBtnNav.addEventListener('click', () => {
    if (currentStreak > 0) {
        currentStreak--;
        updateStreakDisplay();
    }
});

// Check for daily reset at midnight
function checkDailyReset() {
    const lastUpdate = localStorage.getItem('lastUpdate');
    const today = new Date().toDateString();

    if (lastUpdate && lastUpdate !== today) {
        // Reset streak if a day was missed
        const lastUpdateDate = new Date(lastUpdate);
        const daysDifference = Math.floor((new Date() - lastUpdateDate) / (1000 * 60 * 60 * 24));
        
        if (daysDifference > 1) {
            currentStreak = 0;
            updateStreakDisplay();
        }
    }
    
    localStorage.setItem('lastUpdate', today);
}

// Add keyboard support
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === '+') {
        currentStreak++;
        updateStreakDisplay();
    } else if ((e.key === 'ArrowDown' || e.key === '-') && currentStreak > 0) {
        currentStreak--;
        updateStreakDisplay();
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateStreakDisplay();
    checkDailyReset();
});

// Optional: Add CSS for pulse animation if not already present
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
    }

    .pulse {
        animation: pulse 0.3s ease-in-out;
    }
`;
document.head.appendChild(style);
*/
// DOM Elements
const streakCountNav = document.getElementById('streakCountNav');
const decrementBtnNav = document.getElementById('decrementBtnNav');
const incrementBtnNav = document.getElementById('incrementBtnNav');

// State
let totalDaysWorked = 0;

// Function to fetch the total days worked
async function fetchTotalDaysWorked() {
    try {
        const response = await fetch(`/days-worked/${userData.id}`);
        if (!response.ok) throw new Error('Failed to fetch total days worked');
        
        const data = await response.json();
        console.log('Received data from server:', data);
        // Changed this line to use 'streak' instead of 'totalDaysWorked'
        totalDaysWorked = data.streak || 0;
        updateDaysWorkedDisplay();
    } catch (error) {
        console.error('Error fetching total days worked:', error);
    }
}

// Function to update days worked
async function updateDaysWorked(delta) {
    try {
        const response = await fetch(`/days-worked/${userData.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ delta }),
        });

        if (!response.ok) throw new Error('Failed to update days worked');
        
        const data = await response.json();
        console.log('Update response:', data);
        // Changed this line to use 'streak' instead of 'totalDaysWorked'
        totalDaysWorked = data.streak || totalDaysWorked;
        updateDaysWorkedDisplay();
    } catch (error) {
        console.error('Error updating days worked:', error);
    }
}

// Update UI function
function updateDaysWorkedDisplay() {
    console.log('Updating display with:', totalDaysWorked);
    streakCountNav.textContent = totalDaysWorked;
    decrementBtnNav.disabled = totalDaysWorked === 0;
}

// Event listeners
incrementBtnNav.addEventListener('click', () => updateDaysWorked(1));
decrementBtnNav.addEventListener('click', () => {
    if (totalDaysWorked > 0) updateDaysWorked(-1);
});

// Initialize
fetchTotalDaysWorked();

document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value
    };
    console.log(formData);

    const correctDiv = document.getElementById('correct');

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        // Reset styles before showing the response

        if (data.success) {
            // Show success response in the .correct class
            correctDiv.style.color = "green";
            correctDiv.textContent = data.message; // Assuming backend sends 'message' key

            // Store full user data (from response) in localStorage
            localStorage.setItem('userData', JSON.stringify(data.user));

            // Redirect user to another page (home page) after a delay
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } else {
            // Show error response in the .correct class
            correctDiv.style.color = "red";
            correctDiv.textContent = data.message; // Display error message from server
        }
    } catch (error) {
        console.error('Error:', error);
        correctDiv.style.color = "white";
        correctDiv.style.backgroundColor = "red";
        correctDiv.textContent = 'An error occurred. Please try again.';
    }
});

// Assuming userData.name contains the name
let userName = userData.name.charAt(0).toUpperCase() + userData.name.slice(1); // Capitalize the first letter
document.getElementById('pro').innerHTML = `
    <span">${userName}</span>! Your progress
`;

