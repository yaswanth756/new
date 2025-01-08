var express=require("express");
var bodyparser=require("body-parser");

var app=express();
app.use(express.static(__dirname));
app.use(bodyparser.json());
const port=3000;
// schema
// connection


const mysql=require("mysql");
const db = mysql.createConnection({
    host: 'bxxjono60zbq7xnowadb-mysql.services.clever-cloud.com',
    user: 'uwoevgmo1mv3dbyg',
    password: '5yXSnChPestBtlxn4ck1',
    database: 'bxxjono60zbq7xnowadb',
    port:3306          // Default MySQL port
});


db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err);
        return;
    }
    console.log("Connected to MySQL database");

});
app.get('/topics/:userId', (req, res) => {
    const userId = req.params.userId; // Retrieve userId from URL parameter
    const query = 'SELECT * FROM topics WHERE user_id = ?'; // Filter by user_id column

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ success: false, message: 'Database query failed' });
        } else {
            res.status(200).json({ success: true, data: results });
            console.log(results);
        }
    });
});
app.post('/newtopic/:userId', (req, res) => {
    const userId = req.params.userId; // Retrieve userId from the URL parameter
    const { name, total_problems, target_date } = req.body;

    // SQL query to insert a new topic into the database with user_id
    const query = `
        INSERT INTO topics (name, total_problems, target_date,user_id) 
        VALUES (?, ?, ?, ?)
    `;

    // Execute the query with parameterized values
    db.query(query, [ name, total_problems, target_date,userId,], (err, result) => {
        if (err) {
            console.error('Error inserting topic:', err);
            res.status(500).json({ success: false, message: 'Error adding topic' });
        } else {
            res.status(200).json({ success: true, message: 'Topic added successfully' });
        }
    });
});

app.put('/progress/update/:id', (req, res) => {
    const topicId = req.params.id;
    const { easy, medium, hard, userid } = req.body;

    // Validate inputs
    if (!topicId || !Number.isInteger(easy) || !Number.isInteger(medium) || !Number.isInteger(hard) || easy < 0 || medium < 0 || hard < 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid input. Please ensure topic ID and non-negative integer values for easy, medium, and hard are provided.",
        });
    }

    // Calculate the total number of problems solved for the topic
    const incrementSolved = easy + medium + hard;

    // SQL query to update topic progress
    const query = `
        UPDATE topics 
        SET 
            easy = easy + ?, 
            medium = medium + ?, 
            hard = hard + ?, 
            problems_solved = problems_solved + ?, 
            last_updated = NOW() 
        WHERE id = ? AND user_id = ?  -- Ensuring the topic belongs to the correct user
    `;
    
    // Execute the query with parameters
    db.query(query, [easy, medium, hard, incrementSolved, topicId, userid], (error, results) => {
        if (error) {
            console.error("Error updating topic:", error);
            return res.status(500).json({
                success: false,
                message: "An error occurred while updating the progress.",
                error: error.sqlMessage || error.message,
            });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: `No topic found with ID ${topicId}`,
            });
        }

        // Fetch the updated topic
        const selectQuery = `SELECT * FROM topics WHERE id = ?`;
        db.query(selectQuery, [topicId], (selectError, rows) => {
            if (selectError) {
                console.error("Error fetching updated topic:", selectError);
                return res.status(500).json({
                    success: false,
                    message: "Error occurred while retrieving updated topic.",
                });
            }

            res.status(200).json({
                success: true,
                message: `Progress successfully updated for topic ID ${topicId}. Easy: +${easy}, Medium: +${medium}, Hard: +${hard}.`,
                updatedTopic: rows[0],  // Return the updated topic to frontend
            });
        });
    });
});
app.get('/stats/:userId', (req, res) => {
    const userId = req.params.userId;

    db.query(
        `
        SELECT 
            COUNT(*) AS active_topics, 
            SUM(problems_solved) AS total_solved, 
            SUM(total_problems) AS total_problems,
            ROUND((SUM(problems_solved) / SUM(total_problems)) * 100, 2) AS success_rate
        FROM topics
        WHERE user_id = ?
        `,
        [userId],
        (err, results) => {
            if (err) {
                console.error('Database query error:', err);
                return res.status(500).json({ error: 'Failed to fetch stats' });
            }

            // If no data exists, provide default values
            if (!results || results.length === 0) {
                return res.json({
                    activeTopics: 0,
                    problemsSolved: 0,
                    totalProblems: 0,
                    successRate: 0,
                });
            }

            const stats = results[0];
            res.json({
                activeTopics: stats.active_topics || 0, // Default to 0 if null
                problemsSolved: stats.total_solved || 0,
                totalProblems: stats.total_problems || 0,
                successRate: stats.success_rate || 0,
            });
        }
    );
});
app.get('/days-worked/:userId', (req, res) => {
    const userId = req.params.userId;

    db.query(
        'SELECT streak_count FROM user_streaks WHERE user_id = ?',
        [userId],
        (err, results) => {
            if (err) {
                console.error('Database query error:', err);  // Logs error details for debugging
                return res.status(500).json({ error: 'Failed to fetch streak' });
            }

            if (results.length === 0) {
                // If no record exists for the user, default streak count to 0
                return res.json({ streak: 0 });
            }

            res.json({ streak: results[0].streak_count });
        }
    );
});

app.post('/days-worked/:userId', (req, res) => {
    const userId = req.params.userId;
    const { delta } = req.body; // Amount to increment/decrement

    // Ensure delta is either +1 (increment) or -1 (decrement)
    if (typeof delta !== 'number' || (delta !== 1 && delta !== -1)) {
        return res.status(400).json({ error: 'Invalid streak update: Only +1 or -1 allowed' });
    }

    // Query to update streak count or insert a new user if not exists
    db.query(
        `
        INSERT INTO user_streaks (user_id, streak_count) 
        VALUES (?, ?) 
        ON DUPLICATE KEY UPDATE streak_count = GREATEST(0, streak_count + ?)
        `,
        [userId, Math.max(0, delta), delta], // Make sure it doesn't go below 0
        (err) => {
            if (err) {
                console.error('Database query error:', err);
                return res.status(500).json({ error: 'Failed to update streak' });
            }

            // After the insert/update operation, fetch the latest streak count
            db.query(
                'SELECT streak_count FROM user_streaks WHERE user_id = ?',
                [userId],
                (err, results) => {
                    if (err) {
                        console.error('Database query error:', err);
                        return res.status(500).json({ error: 'Failed to fetch updated streak' });
                    }

                    res.json({ streak: results[0].streak_count }); // Return updated streak count
                }
            );
        }
    );
});


app.post('/login', (req, res) => {
    const { name, email } = req.body;

    // Check if user exists
    db.query('SELECT * FROM users WHERE email = ?', [email], (error, rows) => {
        if (error) {
            console.error('Error:', error);
            return res.status(500).json({
                success: false,
                message: 'An error occurred'
            });
        }

        if (rows.length > 0) {
            // Existing user
            const existingUser = rows[0];
            res.json({
                success: true,
                message: 'Welcome back!',
                isNewUser: false,
                user: {
                    id: existingUser.id, // Assuming `id` is the primary key
                    name: existingUser.name,
                    email: existingUser.email,
                }
            });
        } else {
            // New user - insert into database
            db.query('INSERT INTO users (name, email) VALUES (?, ?)', [name, email], (insertError, insertResult) => {
                if (insertError) {
                    console.error('Insert Error:', insertError);
                    return res.status(500).json({
                        success: false,
                        message: 'An error occurred'
                    });
                }

                // Retrieve newly created user's details
                db.query('SELECT * FROM users WHERE id = ?', [insertResult.insertId], (selectError, newUser) => {
                    if (selectError) {
                        console.error('Select Error:', selectError);
                        return res.status(500).json({
                            success: false,
                            message: 'An error occurred'
                        });
                    }

                    res.json({
                        success: true,
                        message: 'Registration successful!',
                        isNewUser: true,
                        user: {
                            id: newUser[0].id,
                            name: newUser[0].name,
                            email: newUser[0].email,
                        }
                    });
                });
            });
        }
    });
});

app.listen(port,()=>{
    console.log("good sucess bro!");
}); 



