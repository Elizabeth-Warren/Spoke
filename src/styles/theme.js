const colors = {
  lightGreen: "rgb(245, 255, 247)",
  red: "rgb(245, 91, 91)",
  green: "rgb(83, 180, 119)",
  darkGreen: "rgb(24, 154, 52)",
  darkGray: "rgb(54, 67, 80)",
  gray: "rgb(153, 155, 158)",
  veryLightGray: "rgb(240, 242, 240)",
  lightGray: "rgb(225, 228, 224)",
  white: "rgb(255,255,255)",
  lightYellow: "rgb(252, 214, 120)",
  //remove unused colors and remove EW from color names
  EWlibertyGreen: "rgb(183,228,207)",
  EWlightLibertyGreen: "rgb(227,244,236)",
  EWdarkLibertyGreen: "rgb(118,203,163)",
  EWnavy: "rgb(35,36,68)",
  EWlightGrey: "rgb(247,247,247)",
  EWred: "rgb(182,27,40)",
  EWlightRed: "rgb(235,126,135)"
};

const defaultFont = "Ringside Regular A";

const text = {
  body: {
    color: colors.EWnavy,
    fontSize: 14,
    fontFamily: defaultFont
  },
  link_light_bg: {
    fontWeight: 400,
    color: colors.EWnavy,
    textDecoration: "none",
    borderBottom: `1px solid ${colors.EWnavy}`,
    cursor: "pointer",
    ":hover": {
      borderBottom: 0,
      color: colors.EWred
    },
    "a:visited": {
      fontWeight: 400,
      color: colors.darkGray,
      textDecoration: "none"
    },
    fontFamily: defaultFont
  },
  link_dark_bg: {
    fontWeight: 400,
    color: colors.white,
    textDecoration: "none",
    borderBottom: `1px solid ${colors.white}`,
    cursor: "pointer",
    ":hover": {
      borderBottom: 0,
      color: colors.EWred
    },
    "a:visited": {
      fontWeight: 400,
      color: colors.veryLightGray,
      textDecoration: "none"
    },
    fontFamily: defaultFont
  },
  header: {
    color: colors.darkGray,
    fontSize: "1.5em",
    fontWeight: 700,
    fontFamily: "Ringside Compressed A",
    textTransform: "uppercase"
  },
  secondaryHeader: {
    color: colors.darkGray,
    fontSize: "1.25em",
    fontFamily: defaultFont
  }
};

const layouts = {
  multiColumn: {
    container: {
      display: "flex",
      flexDirection: "row"
    },
    flexColumn: {
      display: "flex",
      flex: 1,
      flexDirection: "column"
    }
  },
  greenBox: {
    marginTop: "5vh",
    maxWidth: "80%",
    paddingBottom: "7vh",
    borderRadius: 8,
    paddingTop: "7vh",
    marginLeft: "auto",
    marginRight: "auto",
    textAlign: "center",
    backgroundColor: colors.EWnavy,
    color: colors.white
  }
};

const components = {
  floatingButton: {
    margin: 0,
    top: "auto",
    right: 20,
    bottom: 20,
    left: "auto",
    position: "fixed"
  },
  logoDiv: {
    margin: "50 auto",
    overflow: "hidden"
  },
  logoImg: {}
};

const theme = {
  colors,
  text,
  layouts,
  components
};

export default theme;
