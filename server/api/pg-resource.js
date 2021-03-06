function tagsQueryString(tags, itemid, result) {
  for (i = tags.length; i > 0; i--) {
    result += `($${i}, ${itemid}),`;
  }
  return result.slice(0, -1) + ";";
}

module.exports = postgres => {
  return {
    async createUser({ fullname, email, password }) {
      const newUserInsert = {
        text: `INSERT INTO users(fullname, email, password) VALUES($1, $2, $3) RETURNING *;`,
        // Authentication - Server
        values: [fullname, email, password]
      };
      try {
        const user = await postgres.query(newUserInsert);
        return user.rows[0];
      } catch (e) {
        switch (true) {
          case /users_fullname_key/.test(e.message):
            throw "An account with this username already exists.";
          case /users_email_key/.test(e.message):
            throw "An account with this email already exists.";
          default:
            throw "There was a problem creating your account.";
        }
      }
    },
    async getUserAndPasswordForVerification(email) {
      const findUserQuery = {
        text: `SELECT * FROM users WHERE email=$1`, // Authentication - Server
        values: [email]
      };
      try {
        const user = await postgres.query(findUserQuery);
        if (!user) throw "User was not found.";
        return user.rows[0];
      } catch (e) {
        throw "User was not found.";
      }
    },
    async getUserById(id) {
      const findUserQuery = {
        // dont return password for security
        text: `SELECT id, fullname, email, bio FROM users WHERE id=$1`,
        values: [id]
      };
      try {
        const user = await postgres.query(findUserQuery);
        if (!user) throw "User was not found.";
        return user.rows[0];
      } catch (e) {
        throw "User was not found.";
      }
    },
    async getItems(idToOmit) {
      try {
        const items = await postgres.query({
          text: `SELECT * FROM items WHERE ownerid != $1`,
          values: idToOmit ? [idToOmit] : []
        });
        return items.rows;
      } catch (e) {
        throw "Items are not found";
      }
    },
    async getItemsForUser(id) {
      try {
        const items = await postgres.query({
          text: `SELECT * FROM items WHERE ownerid=$1`,
          values: [id]
        });
        return items.rows;
      } catch (e) {
        throw "Items are not found";
      }
    },
    async getBorrowedItemsForUser(id) {
      try {
        const items = await postgres.query({
          text: `SELECT * FROM items WHERE borrowerid = $1`,
          values: [id]
        });
        return items.rows;
      } catch (e) {
        throw "Items are not found";
      }
    },
    async getTags() {
      try {
        const tags = await postgres.query({
          text: `SELECT * FROM tags`
        });
        return tags.rows;
      } catch (e) {
        throw "Tags are not found";
      }
    },
    async getTagsForItem(id) {
      const tagsQuery = {
        text: `SELECT * FROM tags
        INNER JOIN itemtags
        ON itemtags.tagid = tags.id
        WHERE itemid = $1;
        `,
        values: [id]
      };
      try {
        const tags = await postgres.query(tagsQuery);
        return tags.rows;
      } catch (e) {
        throw e;
      }
    },
    async saveNewItem({ item, user }) {
      return new Promise((resolve, reject) => {
        postgres.connect((err, client, done) => {
          try {
            // Begin postgres transaction
            client.query("BEGIN", async err => {
              const { title, description, tags } = item;

              // Insert new Item
              const newItemQuery = {
                text: `INSERT INTO items (title, description, ownerid) VALUES ($1, $2, $3) RETURNING *;`,
                values: [title, description, user]
              };
              const newItem = await postgres.query(newItemQuery);
              const newItemId = newItem.rows[0].id;

              const newTag = {
                text: `INSERT INTO itemtags(tagid, itemid) 
                        VALUES ${tagsQueryString([...tags], newItemId, "")}`,
                values: tags.map(tag => tag.id)
              };
              await postgres.query(newTag);

              client.query("COMMIT", err => {
                if (err) {
                  throw err;
                }
                // release the client back to the pool
                done();
                resolve(newItem.rows[0]);
                // -------------------------------
              });
            });
          } catch (e) {
            // Something went wrong
            client.query("ROLLBACK", err => {
              if (err) {
                throw err;
              }
              // release the client back to the pool
              done();
            });
            switch (true) {
              default:
                throw e;
            }
          }
        });
      });
    }
  };
};
