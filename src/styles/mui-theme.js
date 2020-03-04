import getMuiTheme from "material-ui/styles/getMuiTheme";
import theme from "./theme";
import { grey400, grey500, darkBlack } from "material-ui/styles/colors";
import { fade } from "material-ui/utils/colorManipulator";

const muiTheme = getMuiTheme(
  {
    fontFamily: "Poppins",
    palette: {
      primary1Color: theme.colors.EWnavy,
      textColor: theme.text.body.color,
      primary2Color: theme.colors.EWred,
      primary3Color: grey400,
      accent1Color: theme.colors.EWred,
      accent2Color: theme.colors.lightGray,
      accent3Color: grey500,
      alternateTextColor: theme.colors.white,
      canvasColor: theme.colors.white,
      borderColor: theme.colors.lightGray,
      disabledColor: fade(darkBlack, 0.3)
    },
    datePicker: {
      textColor: theme.colors.EWnavy,
      calendarTextColor: theme.colors.EWnavy,
      selectColor: theme.colors.EWnavy,
      selectTextColor: theme.colors.white,
      headerColor: theme.colors.EWlibertyGreen
    },
    textField: {
      errorColor: theme.colors.EWred
    }
  },
  { userAgent: "all" }
);

export default muiTheme;
