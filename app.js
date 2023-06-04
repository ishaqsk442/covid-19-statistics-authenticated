const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19IndiaPortal.db");

const app = express();

app.use(express.json());
const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

app.post("/login", async (request, response) => {
  const { username, password } = request.body;

  const query = `SELECT * FROM user WHERE username = '${username}';`;

  let data = await database.get(query);

  if (data === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    let passwordmatch = await bcrypt.compare(password, data.password);

    if (passwordmatch === true) {
      //   response.status(200);
      //   response.send("Login success!");

      const payload = { username: username };
      const jwtToken = jwt.sign(payload, "my_token");
      response.send({ jwtToken });
      console.log({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

let forStates = (object) => {
  return {
    stateId: object.state_id,
    stateName: object.state_name,
    population: object.population,
  };
};

let forSingleState = (state) => {
  return {
    stateId: state.state_id,
    stateName: state.state_name,
    population: state.population,
  };
};

let forDistricts = (district) => {
  return {
    districtId: district.district_id,
    districtName: district.district_name,
    stateId: district.state_id,
    cases: district.cases,
    cured: district.cured,
    active: district.active,
    deaths: district.deaths,
  };
};
app.get("/states/", async (request, response) => {
  const authHeader = request.headers["authorization"];
  let Token;
  if (authHeader !== undefined) {
    Token = authHeader.split(" ")[1];
  }
  if (Token === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(Token, "my_token", async (error, user) => {
      if (error) {
        response.status(401);
        response.send("Invalid Token Access");
      } else {
        let query = `SELECT * FROM state`;
        let result = await database.all(query);
        response.send(result.map((object) => forStates(object)));
      }
    });
  }
});

app.get("/districts/", async (request, response) => {
  const authHeader = request.headers["authorization"];
  let Token;
  if (authHeader !== undefined) {
    Token = authHeader.split(" ")[1];
  }
  if (Token === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(Token, "my_token", async (error, user) => {
      if (error) {
        response.status(401);
        response.send("Invalid Token Access");
      } else {
        let query = `SELECT * FROM district`;
        let result = await database.all(query);
        // response.send(result.map((object) => forStates(object)));
        response.send(result);
      }
    });
  }
});

app.get("/states/:stateId/", async (request, response) => {
  let { stateId } = request.params;
  const authHeader = request.headers["authorization"];
  let Token;
  if (authHeader !== undefined) {
    Token = authHeader.split(" ")[1];
  }
  if (Token === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(Token, "my_token", async (error, user) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        let query = `SELECT * FROM state WHERE state_id = ${stateId};`;
        let result = await database.get(query);
        // response.send(result.map((object) => forStates(object)));
        response.send(forSingleState(result));
      }
    });
  }
});

app.post("/districts/", async (request, response) => {
  let { districtName, stateId, cases, cured, active, deaths } = request.body;
  const authHeader = request.headers["authorization"];

  let Token;
  if (authHeader !== undefined) {
    Token = authHeader.split(" ")[1];
  }
  if (Token === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(Token, "my_token", async (error, user) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        let query = `INSERT INTO district (district_name,state_id,cases,cured,active,deaths) VALUES('${districtName}',${stateId},'${cases}','${cured}',${active},${deaths});`;
        let result = await database.run(query);
        // response.send(result.map((object) => forStates(object)));
        // response.send(forSingleState(result));
        response.send("District Successfully Added");
      }
    });
  }
});

app.get("/districts/:districtId/", async (request, response) => {
  let { districtId } = request.params;
  const authHeader = request.headers["authorization"];
  let Token;
  if (authHeader !== undefined) {
    Token = authHeader.split(" ")[1];
  }
  if (Token === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(Token, "my_token", async (error, user) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        let query = `SELECT * FROM district WHERE district_id = ${districtId};`;
        let result = await database.get(query);
        // response.send(result.map((object) => forStates(object)));
        // response.send(forSingleState(result));
        response.send(forDistricts(result));
      }
    });
  }
});

app.delete("/districts/:districtId/", async (request, response) => {
  let { districtId } = request.params;
  const authHeader = request.headers["authorization"];
  let Token;
  if (authHeader !== undefined) {
    Token = authHeader.split(" ")[1];
  }
  if (Token === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(Token, "my_token", async (error, user) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        let query = `DELETE FROM district WHERE district_id = ${districtId};`;
        let result = await database.run(query);
        // response.send(result.map((object) => forStates(object)));
        // response.send(forSingleState(result));
        response.send("District Removed");
      }
    });
  }
});

app.put("/districts/:districtId/", async (request, response) => {
  let { districtId } = request.params;
  let { districtName, stateId, cases, cured, active, deaths } = request.body;
  const authHeader = request.headers["authorization"];
  let Token;
  if (authHeader !== undefined) {
    Token = authHeader.split(" ")[1];
  }
  if (Token === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(Token, "my_token", async (error, user) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        let query = `UPDATE district SET district_name='${districtName}',state_id = ${stateId},cases = ${cases},cured=${cured},active =${active},deaths=${deaths} WHERE district_id = ${districtId};`;
        let result = await database.run(query);
        // response.send(result.map((object) => forStates(object)));
        // response.send(forSingleState(result));
        response.send("District Details Updated");
      }
    });
  }
});

app.get("/states/:stateId/stats/", async (request, response) => {
  let { stateId } = request.params;
  const authHeader = request.headers["authorization"];
  let Token;
  if (authHeader !== undefined) {
    Token = authHeader.split(" ")[1];
  }
  if (Token === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(Token, "my_token", async (error, user) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        let query = `SELECT SUM(cases) AS totalCases,SUM(cured) AS totalCured,SUM(active) AS totalActive,SUM(deaths) AS totalDeaths FROM district WHERE state_id = ${stateId} ;`;
        let result = await database.get(query);
        // response.send(result.map((object) => forStates(object)));
        // response.send(forSingleState(result));
        response.send(result);
      }
    });
  }
});

module.exports = app;
