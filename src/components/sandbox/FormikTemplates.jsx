import React from "react";
import { Formik, Field } from "formik";
import {
  Container,
  Button,
  TextField,
  Checkbox,
  Radio,
  Select,
  MenuItem,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
//====================CustomStyles==================//
const useStyles = makeStyles({
  textStyle: {
    fontFamily: "Lato",
    fontStyle: "oblique",
    color: "#d7be69",
    fontSize: "30px",
  },
  textfieldStyle: {
    fontStyle: "oblique",
  },
  buttonStyle: {
    color: "green",
  },
  selectStyle: {
    margin: 5,
    minWidth: 120,
  },
});

//=================================================//

//===========Custom Hooks and Handlers==============//
//==================================================//

function FormikTemplates() {
  //===============Reference Custom Style Here========//
  const customStyle = useStyles();
  // const [age, setAge] = React.useState("");

  //===============Reference Custom Style Here========//

  return (
    <div>
      <h1 className={customStyle.textStyle}>Custom Text</h1>

      <br />
      <hr />
      <br />

      <TextField
        className={customStyle.textfieldStyle}
        placeholder="custom style text field"
        variant="filled"
      />

      <br />
      <br />
      <hr />
      <br />

      <Button disableRipple>Text-Only Button</Button>

      <Button color="primary">Primary Button</Button>

      <Button color="primary" variant="contained">
        Contained Primary Button
      </Button>

      <Button variant="outlined">Outlined Button</Button>

      <Button className={customStyle.buttonStyle} variant="contained">
        Custom Color Button
      </Button>

      <Button variant="contained" disableElevation>
        Not Elevated Button
      </Button>

      <Button variant="contained" disabled>
        Disabled Button
      </Button>

      <Button href="https://www.chick-fil-a.com/">Link Button</Button>

      <br />
      <br />
      <br />

      {/*===============================================================*/}
      {/*======================Example Form=============================*/}
      {/*===============================================================*/}
      <h1>Example Form</h1>

      <Formik
        initialValues={{
          myStory: "",
          getUpEarly: false,
          career: "",
          schoolSupplies: [],
          favoriteColor: "",
        }}
        onSubmit={(data, { setSubmitting, resetForm }) => {
          setSubmitting(true);
          /*make async call here*/
          console.log(data);
          setSubmitting(false);
          resetForm();
        }}
      >
        {({ values, isSubmitting, handleChange, handleBlur, handleSubmit }) => (
          <form onSubmit={handleSubmit}>
            <TextField
              variant="filled"
              multiline
              label="prompt"
              color="primary"
              name="myStory"
              value={values.myStory}
              onChange={handleChange}
              onBlur={handleBlur}
            />

            <br />
            <br />
            <br />

            <Checkbox
              name="getUpEarly"
              onChange={handleChange}
              color="primary"
            />
            <label className="checkbox-label">I'm an early riser</label>

            <br />
            <br />
            <br />

            <Container>
              <Checkbox
                name="schoolSupplies"
                value="backpack"
                color="primary"
                onChange={handleChange}
              />
              <label className="checkbox-label">backpack</label>
              <Checkbox
                name="schoolSupplies"
                value="pencil"
                color="secondary"
                onChange={handleChange}
              />
              <label className="checkbox-label">pencil</label>
              <Checkbox
                name="schoolSupplies"
                value="notebook"
                color="secondary"
                onChange={handleChange}
              />
              <label className="checkbox-label">notebook</label>
            </Container>

            <br />
            <br />
            <br />

            <h4>Pick a career</h4>
            <Field
              as={Select}
              onChange={handleChange}
              name="career"
              className={customStyle.selectStyle}
              inputProps={{ "aria-label": "Pick a Career" }}
            >
              <MenuItem value={"artist"}>Japan</MenuItem>
              <MenuItem value={"engineer"}>Italy</MenuItem>
              <MenuItem value={"lawyer"}>Europe</MenuItem>
            </Field>

            <br />
            <br />
            <br />

            <Field
              name="favoriteColor"
              type="radio"
              value="blue"
              color="warning"
              as={Radio}
            />
            <Field
              name="favoriteColor"
              type="radio"
              value="orange"
              color="secondary"
              as={Radio}
            />
            <Field
              name="favoriteColor"
              type="radio"
              value="cyan"
              styles={{ color: "green" }}
              as={Radio}
            />

            <br />
            <Button type="submit" disabled={isSubmitting}>
              submit
            </Button>
            <pre>{JSON.stringify(values, null, 2)}</pre>
          </form>
        )}
      </Formik>
    </div>
  );
}

export default FormikTemplates;
