import MaterialTable from "@material-table/core";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MuiAccordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Skeleton from "@mui/material/Skeleton";
import { styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import Header from "../components/Header";

const validateEmail = (email) => {
  return /\S+@\S+\.\S+/.test(email);
};

const EDITABLE_COLUMNS = [
  {
    field: "date",
    title: "Date",
    type: "date",
    defaultSort: "desc",
    // validate: (rowData) =>
    //   (rowData.date || "") instanceof Date && !isNaN(rowData.date || ""),
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
  {
    field: "approved",
    title: "Approved",
    type: "boolean",
    initialEditValue: true,
  },
];

const Accordion = styled((props) => <MuiAccordion disableGutters {...props} />)(
  ({ theme }) => ({})
);

export default function Admin() {
  const [data, setData] = useState([]);

  function editable(member) {
    return {
      onRowAdd: (newData) => {
        return new Promise((resolve, reject) => {
          fetch(`${process.env.REACT_APP_BACKEND_URL}/admin/${member.userid}`, {
            method: "POST",
            credentials: "include",
            body: JSON.stringify(newData),
            headers: {
              "content-type": "application/json",
            },
          })
            .then((response) => response.json())
            .then((data) => {
              console.log(data);
              setData(data);
              resolve();
            })
            .catch((error) => {
              reject();
            });
        });
      },
      onRowDelete: (oldData) => {
        return new Promise((resolve, reject) => {
          fetch(
            `${process.env.REACT_APP_BACKEND_URL}/admin/${member.userid}/${oldData._id}`,
            {
              method: "DELETE",
              credentials: "include",
            }
          )
            .then((response) => response.json())
            .then((data) => {
              setData(data);
              resolve();
            })
            .catch((error) => {
              console.log(error);
            });
        });
      },
      onRowUpdate: (newData, oldData) => {
        return new Promise((resolve, reject) => {
          fetch(
            `${process.env.REACT_APP_BACKEND_URL}/admin/${member.userid}/${oldData._id}`,
            {
              method: "PUT",
              credentials: "include",
              body: JSON.stringify(newData),
              headers: {
                "content-type": "application/json",
              },
            }
          )
            .then((response) => response.json())
            .then((data) => {
              console.log(data);
              setData(data);
              resolve();
            })
            .catch((error) => {
              reject();
            });
        });
      },
    };
  }

  useEffect(() => {
    fetch(`${process.env.REACT_APP_BACKEND_URL}/admin/hours`, {
      method: "GET",
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => setData(data));
  }, []);

  return (
    <>
      <Header />

      <Container>
        <Box component="main" sx={{ p: 3 }}>
          {data ? (
            data.map((member) => (
              <Accordion key={member._id}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ width: "33%", flexShrink: 0 }}>
                    {member.name}
                  </Typography>
                  <Typography sx={{ color: "text.secondary" }}>
                    {member.hours
                      .filter((hour) => hour.approved)
                      .reduce((total, obj) => obj.hours + total, 0)}{" "}
                    Approved Hours,{" "}
                    {member.hours
                      .filter((hour) => !hour.approved)
                      .reduce((total, obj) => obj.hours + total, 0)}{" "}
                    Pending Hours
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <MaterialTable
                    data={member.hours.filter(
                      (hour) => hour.approved === false
                    )}
                    columns={EDITABLE_COLUMNS}
                    options={{
                      rowStyle: { fontFamily: "Roboto", fontSize: "0.875rem" },
                      search: false,
                      actionsColumnIndex: -1,
                      pageSize: 5,
                      pageSizeOptions: [5, 10],
                    }}
                    title="Pending Hours"
                    editable={editable(member)}
                  />
                  <MaterialTable
                    style={{ marginTop: "1em" }}
                    data={member.hours.filter((hour) => hour.approved === true)}
                    columns={EDITABLE_COLUMNS}
                    options={{
                      rowStyle: { fontFamily: "Roboto", fontSize: "0.875rem" },
                      search: false,
                      actionsColumnIndex: -1,
                      pageSize: 5,
                      pageSizeOptions: [5, 10],
                    }}
                    title="Approved Hours"
                    editable={editable(member)}
                  />
                </AccordionDetails>
              </Accordion>
            ))
          ) : (
            <Skeleton variant="rectangular" />
          )}
        </Box>
      </Container>
    </>
  );
}
