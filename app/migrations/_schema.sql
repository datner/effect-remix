CREATE TABLE IF NOT EXISTS "sqlfx_migrations" (
        migration_id integer PRIMARY KEY NOT NULL,
        created_at datetime NOT NULL DEFAULT current_timestamp,
        name VARCHAR(255) NOT NULL
      );
CREATE TABLE users (
        user_id TEXT PRIMARY KEY NOT NULL,
        email TEXT NOT NULL UNIQUE,
        username TEXT NOT NULL,
        bio TEXT NOT NULL,
        image TEXT,

        created_at DATETIME NOT NULL DEFAULT current_timestamp,
        updated_at DATETIME NOT NULL DEFAULT current_timestamp
      );
CREATE TABLE follows (
        follower_id TEXT NOT NULL,
        followee_id TEXT NOT NULL,

        created_at DATETIME NOT NULL DEFAULT current_timestamp,
        updated_at DATETIME NOT NULL DEFAULT current_timestamp,

        FOREIGN KEY (follower_id)
        REFERENCES users (user_id) 
           ON UPDATE CASCADE
           ON DELETE CASCADE,

        FOREIGN KEY (followee_id)
        REFERENCES users (user_id) 
           ON UPDATE CASCADE
           ON DELETE CASCADE,

        UNIQUE(follower_id, followee_id)
      );
CREATE TABLE tags (
        tag_id TEXT PRIMARY KEY NOT NULL,
        name TEXT
      );
CREATE TABLE articles (
        article_id TEXT PRIMARY KEY NOT NULL,
        author_id TEXT,

        slug TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        body TEXT NOT NULL,

        created_at DATETIME NOT NULL DEFAULT current_timestamp,
        updated_at DATETIME NOT NULL DEFAULT current_timestamp,

        FOREIGN KEY (author_id)
        REFERENCES users (user_id) 
           ON UPDATE CASCADE
           ON DELETE SET NULL
      );
CREATE TABLE article_tags (
        article_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,

        FOREIGN KEY (article_id)
        REFERENCES articles (article_id) 
           ON UPDATE CASCADE
           ON DELETE SET NULL,

        FOREIGN KEY (tag_id)
        REFERENCES tags (tag_id) 
           ON UPDATE CASCADE
           ON DELETE SET NULL,

        UNIQUE(article_id, tag_id)
      );
CREATE TABLE liked_articles (
        article_id TEXT NOT NULL,
        user_id TEXT NOT NULL,

        FOREIGN KEY (article_id)
        REFERENCES articles (article_id) 
           ON UPDATE CASCADE
           ON DELETE SET NULL,

        FOREIGN KEY (user_id)
        REFERENCES users (user_id) 
           ON UPDATE CASCADE
           ON DELETE SET NULL,

        UNIQUE(article_id, user_id)
      );
CREATE TABLE comments (
        comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
        author_id TEXT,

        body TEXT NOT NULL,

        created_at DATETIME NOT NULL DEFAULT current_timestamp,
        updated_at DATETIME NOT NULL DEFAULT current_timestamp,

        FOREIGN KEY (author_id)
        REFERENCES users (user_id) 
           ON UPDATE CASCADE
           ON DELETE CASCADE
      );

INSERT INTO sqlfx_migrations VALUES(1,'2024-03-25 21:40:14','create_users');
INSERT INTO sqlfx_migrations VALUES(2,'2024-03-25 21:40:14','create_follows');
INSERT INTO sqlfx_migrations VALUES(3,'2024-03-25 21:40:14','create_articles');
INSERT INTO sqlfx_migrations VALUES(4,'2024-03-25 21:40:14','create_comments');