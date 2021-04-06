
CREATE TABLE IF NOT EXISTS Books
(
    id          SERIAL NOT NULL,
    author      VARCHAR(300),
    title       VARCHAR(300),
    isbn        VARCHAR(300),
    image_url   TEXT        ,
    description VARCHAR(300)
);