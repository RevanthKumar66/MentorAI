'use client';

import { LanguageType, LearningStyleType } from './context';

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  prerequisites: string[];
  objectives: string[];
  // Base theory
  theory: string;
  // Language & Style variations
  adaptiveTheory?: Partial<Record<LanguageType, string>>;
  adaptiveAnalogy?: Record<LearningStyleType, { analogy: string; example: string }>;
  codeBlock?: string;
  codeLanguage?: string;
  codeSandbox?: {
    initialCode: string;
    instructions: string;
    solution: string;
    testCases: { input: string; expected: string; description: string }[];
  };
  bestPractices: string[];
  commonMistakes: string[];
  interviewTips: string[];
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    adaptiveExplanations?: Partial<Record<LanguageType, string>>;
  };
  youtubeRecommendations: {
    title: string;
    creator: string;
    duration: string;
    difficulty: string;
    reason: string;
    link: string;
    thumbnailUrl?: string;
  }[];
  suggestedNext?: string;
}

export interface Module {
  id: string;
  name: string;
  lessons: { id: string; title: string; difficulty: string }[];
}

export interface CourseCategory {
  id: string;
  name: string;
  modules: Module[];
}

export const COURSE_CATEGORIES: CourseCategory[] = [
  {
    id: 'programming',
    name: 'Programming Languages',
    modules: [
      {
        id: 'python',
        name: 'Python Essentials',
        lessons: [
          { id: 'python-basics', title: 'Variables & Dynamic Typing', difficulty: 'Beginner' },
          { id: 'python-lists', title: 'List Comprehensions & Slicing', difficulty: 'Beginner' },
          { id: 'python-decorators', title: 'Decorators & Closures', difficulty: 'Advanced' },
        ],
      },
      {
        id: 'javascript',
        name: 'JavaScript Deep Dive',
        lessons: [
          { id: 'js-closures', title: 'Closures & Scope Chain', difficulty: 'Intermediate' },
          { id: 'js-async', title: 'Promises, Async/Await & Event Loop', difficulty: 'Advanced' },
        ],
      },
      {
        id: 'rust',
        name: 'Rust Systems Programming',
        lessons: [
          { id: 'rust-ownership', title: 'Ownership, Borrowing & Lifetimes', difficulty: 'Advanced' },
        ],
      },
    ],
  },
  {
    id: 'cs',
    name: 'Computer Science Core',
    modules: [
      {
        id: 'dbms',
        name: 'DBMS & SQL Foundations',
        lessons: [
          { id: 'dbms-indexing', title: 'Database Indexing & B-Trees', difficulty: 'Intermediate' },
        ],
      },
      {
        id: 'os',
        name: 'Operating Systems & Processes',
        lessons: [
          { id: 'os-concurrency', title: 'Threads, Concurrency & Deadlocks', difficulty: 'Advanced' },
        ],
      },
      {
        id: 'sysdesign',
        name: 'System Design Scalability',
        lessons: [
          { id: 'sysdesign-hashing', title: 'Consistent Hashing & Partitioning', difficulty: 'Advanced' },
        ],
      },
    ],
  },
  {
    id: 'frontend',
    name: 'Frontend Engineering',
    modules: [
      {
        id: 'react',
        name: 'React Workspace',
        lessons: [
          { id: 'react-rendering', title: 'Virtual DOM & Fiber Architecture', difficulty: 'Advanced' },
        ],
      },
      {
        id: 'css-mastery',
        name: 'Css & Styling',
        lessons: [
          { id: 'css-layout', title: 'Flexbox & Grid Deep Dive', difficulty: 'Intermediate' },
          { id: 'css-animations', title: 'Keyframes & Transitions', difficulty: 'Beginner' },
        ],
      },
    ],
  },
  {
    id: 'backend',
    name: 'Backend Engineering',
    modules: [
      {
        id: 'node-server',
        name: 'Node.js & Express',
        lessons: [
          { id: 'node-event-loop', title: 'Event Loop & Non-Blocking I/O', difficulty: 'Intermediate' },
          { id: 'node-middleware', title: 'Middleware & Request Pipeline', difficulty: 'Intermediate' },
        ],
      },
      {
        id: 'rest-graphql',
        name: 'Api Design',
        lessons: [
          { id: 'rest-principles', title: 'Rest Principles & Status Codes', difficulty: 'Beginner' },
          { id: 'graphql-queries', title: 'GraphQL Queries & Resolvers', difficulty: 'Intermediate' },
        ],
      },
      {
        id: 'auth-patterns',
        name: 'Auth & Security',
        lessons: [
          { id: 'jwt-sessions', title: 'Jwt, Sessions & Oauth 2.0', difficulty: 'Intermediate' },
          { id: 'hashing-encryption', title: 'Password Hashing & Encryption', difficulty: 'Intermediate' },
        ],
      },
    ],
  },
  {
    id: 'devops',
    name: 'Devops & Cloud',
    modules: [
      {
        id: 'docker-k8s',
        name: 'Docker & Kubernetes',
        lessons: [
          { id: 'docker-images', title: 'Docker Images, Containers & Volumes', difficulty: 'Beginner' },
          { id: 'k8s-pods', title: 'Kubernetes Pods, Services & Deployments', difficulty: 'Advanced' },
        ],
      },
      {
        id: 'ci-cd',
        name: 'Ci/Cd Pipelines',
        lessons: [
          { id: 'github-actions', title: 'Github Actions Workflow Essentials', difficulty: 'Intermediate' },
          { id: 'gitops', title: 'Gitops & Argo Cd Patterns', difficulty: 'Advanced' },
        ],
      },
      {
        id: 'cloud-aws',
        name: 'Aws Fundamentals',
        lessons: [
          { id: 'aws-iam', title: 'Iam Roles, Policies & Security', difficulty: 'Intermediate' },
          { id: 'aws-ec2-s3', title: 'Ec2, S3 & Vpc Networking', difficulty: 'Beginner' },
        ],
      },
    ],
  },
  {
    id: 'mobile',
    name: 'Mobile Development',
    modules: [
      {
        id: 'react-native',
        name: 'React Native',
        lessons: [
          { id: 'rn-navigation', title: 'Navigation & Deep Linking', difficulty: 'Intermediate' },
          { id: 'rn-state', title: 'State Management in React Native', difficulty: 'Intermediate' },
        ],
      },
      {
        id: 'flutter',
        name: 'Flutter & Dart',
        lessons: [
          { id: 'flutter-widgets', title: 'Widget Tree & State Lifecycle', difficulty: 'Beginner' },
          { id: 'flutter-animations', title: 'Implicit & Explicit Animations', difficulty: 'Advanced' },
        ],
      },
    ],
  },
  {
    id: 'datascience',
    name: 'Data Science',
    modules: [
      {
        id: 'pandas-numpy',
        name: 'Pandas & Numpy',
        lessons: [
          { id: 'pandas-dataframes', title: 'Dataframes, Groupby & Merge', difficulty: 'Beginner' },
          { id: 'numpy-broadcasting', title: 'Numpy Broadcasting & Vectorization', difficulty: 'Intermediate' },
        ],
      },
      {
        id: 'data-viz',
        name: 'Data Visualization',
        lessons: [
          { id: 'matplotlib-seaborn', title: 'Matplotlib & Seaborn Essentials', difficulty: 'Beginner' },
          { id: 'plotly-dash', title: 'Interactive Dashboards with Plotly', difficulty: 'Intermediate' },
        ],
      },
      {
        id: 'statistics',
        name: 'Statistics & Probability',
        lessons: [
          { id: 'hypothesis-testing', title: 'Hypothesis Testing & P-Values', difficulty: 'Intermediate' },
          { id: 'bayesian-inference', title: 'Bayesian Inference Fundamentals', difficulty: 'Advanced' },
        ],
      },
    ],
  },
  {
    id: 'aiml',
    name: 'Ai & Machine Learning',
    modules: [
      {
        id: 'ml-fundamentals',
        name: 'Ml Foundations',
        lessons: [
          { id: 'linear-regression', title: 'Linear & Logistic Regression', difficulty: 'Beginner' },
          { id: 'decision-trees', title: 'Decision Trees & Random Forests', difficulty: 'Intermediate' },
        ],
      },
      {
        id: 'deep-learning',
        name: 'Deep Learning',
        lessons: [
          { id: 'neural-networks', title: 'Feedforward Neural Networks & Backprop', difficulty: 'Advanced' },
          { id: 'cnn-rnn', title: 'Cnns for Vision & Rnns for Sequences', difficulty: 'Advanced' },
        ],
      },
      {
        id: 'llm-prompting',
        name: 'Llms & Prompt Engineering',
        lessons: [
          { id: 'rag-systems', title: 'Rag Systems & Vector Stores', difficulty: 'Advanced' },
          { id: 'prompt-techniques', title: 'Few-Shot, Chain of Thought & Tool Use', difficulty: 'Intermediate' },
        ],
      },
    ],
  },
  {
    id: 'dsa',
    name: 'Dsa & Algorithms',
    modules: [
      {
        id: 'arrays-strings',
        name: 'Arrays & Strings',
        lessons: [
          { id: 'two-pointers', title: 'Two-Pointer & Sliding Window', difficulty: 'Beginner' },
          { id: 'prefix-suffix', title: 'Prefix Sums & Kadane Algorithm', difficulty: 'Intermediate' },
        ],
      },
      {
        id: 'graphs-trees',
        name: 'Graphs & Trees',
        lessons: [
          { id: 'bfs-dfs', title: 'Bfs, Dfs & Topological Sort', difficulty: 'Intermediate' },
          { id: 'binary-trees', title: 'Binary Search Trees & Balancing', difficulty: 'Intermediate' },
        ],
      },
      {
        id: 'dynamic-programming',
        name: 'Dynamic Programming',
        lessons: [
          { id: 'dp-1d', title: '1D Dp: Fibonacci & Climbing Stairs', difficulty: 'Beginner' },
          { id: 'dp-2d', title: '2D Dp: Longest Common Subsequence', difficulty: 'Advanced' },
        ],
      },
    ],
  },
  {
    id: 'tools',
    name: 'Tools & Productivity',
    modules: [
      {
        id: 'git-advanced',
        name: 'Git & Version Control',
        lessons: [
          { id: 'git-rebase', title: 'Rebase, Cherry-Pick & Conflict Resolution', difficulty: 'Intermediate' },
          { id: 'git-workflows', title: 'Gitflow & Trunk-Based Development', difficulty: 'Beginner' },
        ],
      },
      {
        id: 'terminal-shell',
        name: 'Terminal & Shell Scripting',
        lessons: [
          { id: 'bash-scripting', title: 'Bash Scripting & Automation', difficulty: 'Beginner' },
          { id: 'regex-mastery', title: 'Regular Expressions for Developers', difficulty: 'Intermediate' },
        ],
      },
    ],
  },
];

export const LESSON_DATABASE: Record<string, Lesson> = {
  'dbms-indexing': {
    id: 'dbms-indexing',
    moduleId: 'dbms',
    title: 'Database Indexing & B-Trees',
    difficulty: 'Intermediate',
    duration: '15 mins',
    prerequisites: ['Basic SQL Queries', 'Understanding of Binary Search Trees'],
    objectives: [
      'Understand the role of database indices in scaling read operations.',
      'Contrast sequential table scans with index lookups.',
      'Explain B-Tree node layout and traverse behavior.',
    ],
    theory: `Database index optimization is a cornerstone of systems engineering. Without indices, relational databases must execute a sequential scan, visiting every row in a table to satisfy queries. A B-Tree index maintains sorted records in a balanced hierarchical structure, changing query lookup complexity from O(N) to O(log N).

A B-Tree consists of root, internal, and leaf nodes. In modern databases (specifically MySQL InnoDB using B+Trees), actual row records or references are stored solely at the leaf node layer, linked sequentially. This allows rapid range query lookups since leaves form a contiguous linked list.`,
    adaptiveTheory: {
      'Simple English': `Database indices help make searching for data in a database extremely fast. Instead of looking at every row (which takes O(N) time), the database uses a B-Tree structure. Think of it like a book index: instead of reading the whole book to find a topic, you jump to the index and go directly to the page. 

A B+Tree is a special version where all actual data is stored at the bottom (leaf nodes), and they are chained together. This makes searching for ranges (like ages between 20 and 30) super fast because you can just walk along the bottom chain.`,
      'Telugu + English Mixed': `Database indexing ante data set lo specific row ni database search chestunnappudu query quick ga execute avvadaniki clear roadmap. Oka indexing lekapothe, database engine table scanning chesi, table body loni entire items ni sequential row-by-row cross-check cheyalsi vastundi. Deenni data-scans or linear search (O(N) complexity) antaru.

Kaani index dynamically setup chesthe, database internal ga B-Tree mapping create chestundi. Memory search complexity direct ga O(N) nunchi logarithmic scale (O(log N)) ki optimize avtundi. Dynamic nodes structure lo root, internal, and leaf levels untayi. MySQL and standard databases lo B+Tree style vadatharu - ikkada only leaf nodes lone actual pointers link ayyi untayi, database values range scans simple link traversal tho scan cheyyochu.`,
      'Hindi': `डेटाबेस इंडेक्सिंग का मुख्य उद्देश्य डेटा खोजने की प्रक्रिया को तेज करना है। बिना इंडेक्स के, डेटाबेस को हर एक पंक्ति (row) को क्रमवार (sequential scan) जांचना पड़ता है, जिसमें O(N) का समय लगता है।

B-Tree इंडेक्स एक संतुलित पेड़ (balanced tree) की तरह काम करता है, जिससे खोज की जटिलता O(N) से घटकर O(log N) हो जाती है। विशेष रूप से B+Tree में, वास्तविक डेटा केवल सबसे निचले पत्तों (leaf nodes) में संचित होता है और वे आपस में जुड़े (linked list) होते हैं, जिससे श्रेणी खोज (range queries) बहुत तेज हो जाती हैं।`,
    },
    adaptiveAnalogy: {
      'Theory & Explanations': {
        analogy: 'The Phone Book Index',
        example: 'To find "John Doe" in a physical directory, you do not flip page-by-page from page 1. You turn to the letter "D" divider, then "Do", then locate the entry. The divider tabs act as index nodes directing your hand.',
      },
      'Visual Learning': {
        analogy: 'Branching Tree Paths',
        example: 'Imagine a fork in the road with signs directing you. If your target is 42, and the sign says "Paths <= 30 Left, Paths > 30 Right", you ignore the left entirely, reducing the search space by half instantly.',
      },
      'Code & Practical Examples Heavy': {
        analogy: 'Binary Search in Code',
        example: 'Rather than a linear loop, we execute a mid-point comparison in a sorted list. In SQL, this binary search logic is mapped across disk pages.',
      },
      'Interview Prep & Leetcode Focus': {
        analogy: 'Search In Sorted Array',
        example: 'Relates directly to Binary Search (Leetcode 704). Interviews frequently test indexes when designing scalable API backends to resolve high latency.',
      },
      'Project-Based Building': {
        analogy: 'File System Indexing',
        example: 'Like building a directory hash map. Indexing maps the file key identifier to the disk sector address offset directly.',
      },
    },
    codeBlock: `CREATE UNIQUE INDEX idx_users_email ON users(email);

-- Query executing with O(log N) traversal:
SELECT * FROM users WHERE email = 'mentor@ai.os';`,
    codeLanguage: 'sql',
    codeSandbox: {
      initialCode: `-- Task: Write a query to create an index named 'idx_students_roll'
-- on the 'students' table for the 'roll_number' column.
-- Then, write a SELECT query to find the student with roll_number 101.

`,
      instructions: `1. Create an index 'idx_students_roll' on table 'students' and column 'roll_number'.
2. Select all columns for roll_number = 101.`,
      solution: `CREATE INDEX idx_students_roll ON students(roll_number);
SELECT * FROM students WHERE roll_number = 101;`,
      testCases: [
        { input: 'CREATE INDEX', expected: 'CREATE INDEX', description: 'Checks if CREATE INDEX statement is present.' },
        { input: 'roll_number = 101', expected: 'roll_number = 101', description: 'Checks if SELECT queries roll_number 101.' },
      ],
    },
    bestPractices: [
      'Only index columns frequently appearing in WHERE clauses, JOIN conditions, or ORDER BY statements.',
      'Use composite indices matching query prefixes to optimize multi-column checks.',
    ],
    commonMistakes: [
      'Over-indexing tables. Every index incurs overhead on INSERT, UPDATE, and DELETE operations.',
      'Indexing low-cardinality columns (e.g. status fields, boolean flags) which usually prompts query planners to ignore indices.',
    ],
    interviewTips: [
      'Explain the difference between clustered and non-clustered indices (Clustered contains actual data; Non-clustered stores index values linked to page pointers).',
      'Explain why sequential primary key values prevent B-Tree fragmentation during insertions.',
    ],
    quiz: {
      question: 'Which of the following describes the difference between a B-Tree and a B+Tree index?',
      options: [
        'B+Tree indexes store all row keys and record payloads only in leaf nodes.',
        'B-Tree indexes are not balanced.',
        'B+Tree nodes cannot have child pointers.',
        'B-Tree indices require sequential scans for all searches.',
      ],
      correctIndex: 0,
      explanation: 'In a B+Tree, internal nodes contain only routing keys, while leaf nodes store actual data payloads or pointers and are linked sequentially for quick range scans.',
      adaptiveExplanations: {
        'Telugu + English Mixed': 'B+Tree lo internal routing key levels map ayyi untai, actual values array/payload leaf nodes lone place avtundi. Leaf nodes linked list laga connect avvadam valla Range Scans direct linear speed tho check cheyyochu. So correct option 0.',
      },
    },
    youtubeRecommendations: [
      {
        title: 'Database Indexing Explained',
        creator: 'Hussein Nasser',
        duration: '18:42',
        difficulty: 'Intermediate',
        reason: 'Hussein provides an in-depth systems explanation of indexing under the hood, traversing disk pages and showing engine execution paths.',
        link: 'https://www.youtube.com/watch?v=aZjYrkkcxr4',
      },
      {
        title: 'How B-Trees and B+Trees Work in Databases',
        creator: 'ByteByteGo',
        duration: '08:15',
        difficulty: 'Beginner',
        reason: 'Visual animations of tree node splitting, routing keys, and leaf layout nodes.',
        link: 'https://www.youtube.com/watch?v=K1a2Rl_R-7c',
      },
    ],
    suggestedNext: 'os-concurrency',
  },
  'os-concurrency': {
    id: 'os-concurrency',
    moduleId: 'os',
    title: 'Threads, Concurrency & Deadlocks',
    difficulty: 'Advanced',
    duration: '20 mins',
    prerequisites: ['Process Memory Space layout', 'CPU Scheduling basics'],
    objectives: [
      'Analyze the life cycle of a process versus an executing thread.',
      'Contrast mutual exclusion lock mechanisms with semaphores.',
      'Define Coffman conditions necessary for deadlock execution.',
    ],
    theory: `Concurrency allows modern OS kernels to execute thousands of execution contexts on a limited set of CPU cores. While processes run in fully sandboxed, isolated address spaces, threads within the same process share heap memory, open file handlers, and variables. This shared access makes threads lightweight but exposes them to race conditions, where non-atomic operations produce unpredictable state conflicts.

Deadlock is a state where a set of threads are blocked because each process holds a resource and waits for another resource held by some other process.`,
    adaptiveTheory: {
      'Simple English': `Concurrency means doing multiple things at the same time. While a Process is like a whole factory with its own space, Threads are workers in that factory who share the same tables and tools (heap memory). Because they share tools, they can clash (race conditions) if two threads try to edit the same variable at the same time.

A Deadlock is when Worker A holds Tool 1 and waits for Tool 2, while Worker B holds Tool 2 and waits for Tool 1. Both stand frozen forever.`,
      'Telugu + English Mixed': `Concurrency ante simultaneously multiple operations ni parallel address nodes tho coordinate cheyadam. Space level lo, Process ki individual independent memory boundaries untayi. But Threads are sub-activities, okka process range tone variables, heap space, and open files ni dynamically share chesukuntayi. Shares cheyyadam lightweight ga unna, Race Conditions vache scope ekkuva.

Deadlock condition eppudu osthundi ante, suppose Thread A holds Lock 1 and waits for Lock 2, parallel ga Thread B holds Lock 2 and waits for Lock 1. Dynamic logic code loop crash ayyi, execution permanently block aipothundi.`,
    },
    adaptiveAnalogy: {
      'Theory & Explanations': {
        analogy: 'The Shared Kitchen',
        example: 'Two chefs (threads) sharing the same kitchen (process memory) trying to edit the same soup pot. If both add salt at the exact same second without communicating (locks), the soup becomes twice as salty.',
      },
      'Visual Learning': {
        analogy: 'Train Intersection Lock',
        example: 'Two trains meeting head-on at a single track junction. Train 1 cannot move forward until Train 2 backs up. Train 2 cannot back up until Train 1 moves. Complete standstill.',
      },
      'Code & Practical Examples Heavy': {
        analogy: 'Mutex Guarding',
        example: 'Using locks like token cards. Only the thread holding the token card can modify the shared variable, checking out the resource and releasing it later.',
      },
      'Interview Prep & Leetcode Focus': {
        analogy: 'Classic Dining Philosophers',
        example: 'Frequently tested in concurrency design rounds (Leetcode 1114-1117). Explains circular wait and resource locks acquisition order.',
      },
      'Project-Based Building': {
        analogy: 'Database Transaction Locks',
        example: 'Equivalent to locking database row writes (SELECT FOR UPDATE) to avoid double balance deductions in banking databases.',
      },
    },
    codeBlock: `#include <pthread.h>

pthread_mutex_t lock;
int shared_counter = 0;

void* increment(void* arg) {
    pthread_mutex_lock(&lock);
    shared_counter++; // Safe atomic segment
    pthread_mutex_unlock(&lock);
    return NULL;
}`,
    codeLanguage: 'cpp',
    codeSandbox: {
      initialCode: `// Task: Fix the race condition in the following pseudocode.
// Wrap the count updates in lock() and unlock() calls.

void add_item() {
    // Acquire the mutex lock 'my_lock' here
    
    inventory_count++;
    
    // Release the mutex lock 'my_lock' here
}
`,
      instructions: `Wrap the inventory_count increment inside 'lock(my_lock)' and 'unlock(my_lock)' statements to ensure concurrency safety.`,
      solution: `void add_item() {
    lock(my_lock);
    inventory_count++;
    unlock(my_lock);
}`,
      testCases: [
        { input: 'lock(my_lock)', expected: 'lock(my_lock)', description: 'Checks if lock acquisition is written.' },
        { input: 'unlock(my_lock)', expected: 'unlock(my_lock)', description: 'Checks if lock release is written.' },
      ],
    },
    bestPractices: [
      'Always acquire locks in a global predefined order to prevent circular wait deadlock patterns.',
      'Keep critical sections as small as possible to minimize thread resource starvation.',
    ],
    commonMistakes: [
      'Calling block-level operations inside an active lock segment, causing cascading performance latency.',
      'Neglecting to release locks in error or exception catch paths.',
    ],
    interviewTips: [
      'Name the four Coffman conditions for deadlocks: Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait.',
      'Describe the difference between User Threads and Kernel Threads.',
    ],
    quiz: {
      question: 'Which of the following is NOT one of the Coffman conditions required to create a deadlock?',
      options: [
        'Mutual exclusion',
        'Hold and wait',
        'Preemptive resource reclaim',
        'Circular wait',
      ],
      correctIndex: 2,
      explanation: 'No preemption is required. If resource reclaim is preemptive, deadlock cannot persist because the OS would forcibly release blocked allocations.',
    },
    youtubeRecommendations: [
      {
        title: 'Introduction to Concurrency and Threads',
        creator: 'Jacob Sorber',
        duration: '12:10',
        difficulty: 'Beginner',
        reason: 'Jacob provides clean C programming demonstrations showing how threads share address space and split stack variables.',
        link: 'https://www.youtube.com/watch?v=uA8X5zNOGw8',
      },
    ],
    suggestedNext: 'sysdesign-hashing',
  },
  'sysdesign-hashing': {
    id: 'sysdesign-hashing',
    moduleId: 'sysdesign',
    title: 'Consistent Hashing & Partitioning',
    difficulty: 'Advanced',
    duration: '25 mins',
    prerequisites: ['Basic Hashing', 'Load Balancing concepts'],
    objectives: [
      'Evaluate horizontal versus vertical server scaling trade-offs.',
      'Formulate routing protocols (Round Robin, Consistent Hashing) inside Load Balancers.',
      'Explain how consistent hashing prevents cache invalidation when scaling cluster nodes.',
    ],
    theory: `When application traffic spikes, a single server (even scaled vertically with extra CPU and memory) inevitably hits physical limits. Horizontal scaling shifts work across a cluster of commodity nodes. A Load Balancer (LB) distributes client requests, acting as a traffic cop.

LBs can run at Layer 4 (Transport layer, TCP routing) or Layer 7 (Application layer, HTTP context routing). When partition databases scale, we rely on hashing algorithms to evenly distribute users. Consistent hashing allows us to add or remove cache nodes without invalidating the entire cache set.`,
    adaptiveTheory: {
      'Simple English': `When your app gets too busy, instead of buying a bigger computer, you buy multiple computers. But how do you know which user goes to which computer? Modulo hashing (User ID % Number of Servers) works, but if one server crashes, the math changes, and all your cache is lost.

Consistent Hashing maps servers and users onto a circle (ring) from 0 to 360 degrees. A user travels clockwise until they hit the first server node. If a server is added or removed, only a small part of the circle is affected, saving your cache!`,
      'Telugu + English Mixed': `Consistent Hashing ante system nodes and data objects ni logical 360-degree circle (Hash Ring) lo map cheyyadam. Dynamic server loads scale chesetappudu standard modular hashing (key % N) use cheste, scale values load fluctuations valla servers list change ayinappudu entire cache mapping key positions change aipothayi (Cache Invalidation).

But Consistent Hashing lo, static ring loop lo items and nodes position code base ring boundary alignment paina store avtundi. Objects are routed clockwise directions, so add or remove operations block chesinappudu localized segment targets mathrame change avthayi, saving database load time.`,
    },
    adaptiveAnalogy: {
      'Theory & Explanations': {
        analogy: 'Musical Chairs Ring',
        example: 'Imagine chairs placed in a circle. When players enter, they sit in the closest chair going clockwise. If you add one more chair, only players near that new chair might move. Everyone else stays in their seat.',
      },
      'Visual Learning': {
        analogy: 'The Clock Face Routing',
        example: 'Imagine servers placed at 12:00, 4:00, and 8:00 on a clock. Requests map to different timestamps. A request mapping to 2:00 moves clockwise and hits the 4:00 server. If 12:00 goes offline, 10:00 requests route to 4:00 instead, leaving 6:00 requests untouched.',
      },
      'Code & Practical Examples Heavy': {
        analogy: 'TreeMap Ring traversal',
        example: 'In code, consistent hashing uses a binary search array or TreeMap. We search for the ceiling entry matching the hash key. If none exists, we wrap around and return the first element.',
      },
      'Interview Prep & Leetcode Focus': {
        analogy: 'System Design Standard',
        example: 'A must-know concept for scaling interviews at Meta, Netflix, and Amazon. Tests understanding of cache efficiency, hot-spotting, and virtual nodes.',
      },
      'Project-Based Building': {
        analogy: 'Distributed Cache Pool',
        example: 'Implementing a Redis cluster hash ring where cache keys are distributed across multiple server instances dynamically.',
      },
    },
    codeBlock: `# Example nginx routing config
upstream backend {
    least_conn; # Route to server with fewest connections
    server backend1.mentor.ai;
    server backend2.mentor.ai;
}`,
    codeLanguage: 'nginx',
    bestPractices: [
      'Place stateless API application layers behind LBs so individual servers can be shut down or added without context loss.',
      'Use health-check monitors that automatically remove dead nodes from the Load Balancer targets list.',
    ],
    commonMistakes: [
      'Storing user sessions locally in memory on scaled nodes, causing users to lose login state if routed to a different server.',
      'Underestimating database writes bottlenecks when scaling application clusters.',
    ],
    interviewTips: [
      'Be ready to outline how consistent hashing distributes keys along a logical 360-degree circle or ring.',
      'Explain the difference between Layer 4 and Layer 7 Load Balancing.',
    ],
    quiz: {
      question: 'Why is consistent hashing preferred over standard modulo hashing (key % N) for distributed cache pools?',
      options: [
        'Consistent hashing runs in O(1) time.',
        'Adding or removing a node only requires remapping a fraction of key entries instead of invalidating the entire cache.',
        'Modulo hashing does not support string keys.',
        'Consistent hashing requires no routing table.',
      ],
      correctIndex: 1,
      explanation: 'With standard modulo hashing, changing the node count N invalidates almost 100% of the cache entries. Consistent hashing only invalidates keys residing on the immediately affected ring segment (roughly K/N keys).',
    },
    youtubeRecommendations: [
      {
        title: 'Consistent Hashing Explained',
        creator: 'Gaurav Sen',
        duration: '14:50',
        difficulty: 'Intermediate',
        reason: 'Gaurav visualizes hashing collisions, the load balancing ring, and explains how virtual nodes prevent hotspots on servers.',
        link: 'https://www.youtube.com/watch?v=zaRkONvyGr8',
      },
    ],
    suggestedNext: 'python-basics',
  },
  'python-basics': {
    id: 'python-basics',
    moduleId: 'python',
    title: 'Variables & Dynamic Typing',
    difficulty: 'Beginner',
    duration: '10 mins',
    prerequisites: ['Basic math operations'],
    objectives: [
      'Understand variables as label references rather than boxes.',
      'Explain how Python handles dynamic type assignments.',
      'Differentiate mutable and immutable object types.',
    ],
    theory: `In Python, variables are not container boxes holding data. Instead, they are label references bound to object instances in heap memory. Python is dynamically typed (types are checked at runtime) and strongly typed (type conversions do not happen implicitly).

For example, when you write x = 5, Python creates an integer object with value 5, and binds x to reference it. If you write x = "hello", Python creates a new string object and rebinds the label x, leaving the old integer to be garbage collected if no other labels refer to it.`,
    bestPractices: [
      'Use descriptive, snake_case names for variables.',
      'Use type hints (x: int = 5) to improve readability and catch IDE warnings.',
    ],
    commonMistakes: [
      'Assuming changing a list variable changes all reference copies without knowing lists are mutable.',
      'Performing invalid type operations (e.g. adding string + int) expecting implicit casting.',
    ],
    interviewTips: [
      'Explain why integers in Python are immutable while lists are mutable.',
      'Understand the role of the refcount in Python garbage collection (sys.getrefcount).',
    ],
    quiz: {
      question: 'What happens when you run "x = 5" followed by "x = [1, 2]" in Python?',
      options: [
        'An error is thrown because x type cannot change.',
        'The value 5 is deleted and replaced in the same memory box.',
        'The label x is rebound from the integer object 5 to a new list object.',
        'Python crashes because list assignments require new variables.',
      ],
      correctIndex: 2,
      explanation: 'Python variables are reference bindings. The label x is simply redirected to the new list object [1, 2] in heap memory.',
    },
    youtubeRecommendations: [
      {
        title: 'Python Variable References Explained',
        creator: 'mCoding',
        duration: '10:15',
        difficulty: 'Intermediate',
        reason: 'A deep dive into how variables work under the hood in CPython, showing memory address locations using the id() function.',
        link: 'https://www.youtube.com/watch?v=_AEJHKGk9yA',
      },
    ],
    suggestedNext: 'python-lists',
  },
};
