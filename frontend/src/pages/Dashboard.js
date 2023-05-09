import MaterialTable from "@material-table/core";
import { CardContent, LinearProgress } from "@material-ui/core";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import Header from "../components/Header";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

const validateEmail = (email) => {
  return /\S+@\S+\.\S+/.test(email);
};

const EDITABLE_COLUMNS = [
  {
    field: "start_date",
    title: "Start Date",
    type: "date",
    defaultSort: "desc",
    // validate: (rowData) =>
    //   (rowData.date || "") instanceof Date && !isNaN(rowData.date || ""),
    validate: (rowData) => {
      return rowData.start_date != null && rowData.start_date !== undefined;
    },
  },
  {
    field: "end_date",
    title: "End Date",
    type: "date",
    defaultSort: "desc",
    // validate: (rowData) =>
    //   (rowData.date || "") instanceof Date && !isNaN(rowData.date || ""),
    validate: (rowData) => {
      return rowData.end_date != null && rowData.end_date !== undefined;
    },
  },
  {
    field: "hours",
    title: "Hours",
    type: "numeric",
    validate: (rowData) => (rowData.hours || 0) > 0,
  },
  {
    field: "name",
    title: "Name of Activity",
    validate: (rowData) => (rowData.name || "").length > 0,
  },
  {
    field: "description",
    title: "Description of Activity",
    sorting: false,
    validate: (rowData) => (rowData.description || "").length > 0,
  },
  {
    field: "supervisor_name",
    title: "Supervisor Name",
    validate: (rowData) => (rowData.supervisor_name || "").length > 0,
  },
  {
    field: "supervisor_contact",
    title: "Supervisor Email",
    sorting: false,
    validate: (rowData) => validateEmail(rowData.supervisor_contact || ""),
  },
];

const REQUIRED_HOURS = 10;

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [totalHours, setTotalHours] = useState(0);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState();
  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setError(null);
  };

  useEffect(() => {
    (async function () {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/hours`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      const hours = await response.json();
      console.log(hours);
      setData(hours);
      setIsLoading(false);
    })();
  }, []);

  useEffect(() => {
    setTotalHours(getTotalHours());
    console.log(getTotalHours());
  }, [data]);

  function getHours(approved) {
    return data.filter((hour) => hour.approved === approved);
  }

  function getTotalHours() {
    return getHours(true).reduce((total, obj) => obj.hours + total, 0);
  }

  function normalize(hours) {
    if (hours > REQUIRED_HOURS) {
      return REQUIRED_HOURS;
    }
    return hours;
  }

  return (
    <>
      <Header />

      <Container>
        <Box component="main" sx={{ p: 3 }}>
          <Card sx={{ minWidth: 275, marginTop: 2, marginBottom: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Progress
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(normalize(totalHours) / REQUIRED_HOURS) * 100}
              />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ marginTop: 1 }}
              >
                {totalHours}/{REQUIRED_HOURS} (
                {(totalHours / REQUIRED_HOURS) * 100}%)
              </Typography>
            </CardContent>
          </Card>
          <MaterialTable
            data={data.filter((hour) => hour.approved === false)}
            isLoading={isLoading}
            columns={EDITABLE_COLUMNS}
            options={{
              rowStyle: { fontFamily: "Roboto", fontSize: "0.875rem" },
              search: false,
              actionsColumnIndex: -1,
              pageSize: 5,
              pageSizeOptions: [5, 10],
            }}
            title="Pending Hours"
            editable={{
              onRowAdd: (newData) => {
                return new Promise((resolve, reject) => {
                  fetch(`${process.env.REACT_APP_BACKEND_URL}/hour`, {
                    method: "POST",
                    credentials: "include",
                    body: JSON.stringify(newData),
                    headers: {
                      "content-type": "application/json",
                    },
                  })
                    .then((response) => response.json())
                    .then((data) => {
                      if (data.message) {
                        setError(data.message);
                        reject();
                      } else {
                        console.log(data);
                        setData(data);
                        resolve();
                      }
                    })
                    .catch((error) => {
                      setError(error.message);
                      reject();
                    });
                });
              },
              onRowDelete: (oldData) => {
                return new Promise((resolve, reject) => {
                  fetch(
                    `${process.env.REACT_APP_BACKEND_URL}/hour/${oldData._id}`,
                    {
                      method: "DELETE",
                      credentials: "include",
                    }
                  )
                    .then((response) => response.json())
                    .then((data) => {
                      if (data.message) {
                        setError(data.message);
                        reject();
                      } else {
                        console.log(data);
                        setData(data);
                        resolve();
                      }
                    })
                    .catch((error) => {
                      setError(error.message);
                      reject();
                    });
                });
              },
            }}
          />
          <MaterialTable
            style={{ marginTop: "1em" }}
            data={data.filter((hour) => hour.approved === true)}
            isLoading={isLoading}
            columns={EDITABLE_COLUMNS}
            options={{
              rowStyle: { fontFamily: "Roboto", fontSize: "0.875rem" },
              search: false,
              actionsColumnIndex: -1,
              pageSize: 5,
              pageSizeOptions: [5, 10],
            }}
            title="Approved Hours"
          />
        </Box>
      </Container>
      <Snackbar open={!!error} autoHideDuration={3000} onClose={handleClose}>
        <Alert severity="error" elevation={6} variant="filled">
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}
