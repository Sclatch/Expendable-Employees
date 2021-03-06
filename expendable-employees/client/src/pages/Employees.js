import React, {useState, useEffect} from 'react';
import {
    DataGrid,GridToolbar, GridFooter
} from '@material-ui/data-grid';
import {makeStyles} from '@material-ui/core/styles';
import {
    Button,
    Dialog, DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    Paper, TextField,
    Tooltip,
    Typography
} from "@material-ui/core";
import {DeleteForever, DeleteSweep, Edit, Event} from "@material-ui/icons";
import CloseIcon from "@material-ui/icons/Close";
import {MuiPickersUtilsProvider, DateTimePicker} from "@material-ui/pickers";
import MomentUtils from '@date-io/moment';
import axios from "axios";
import {getUserToken} from "../utils/userSession";

const columns = [
    {field: 'id', headerName: 'ID', flex: 1},
    {field: 'firstName', headerName: 'First name', flex: 1},
    {field: 'lastName', headerName: 'Last name', flex: 1},
    {
        field: 'fullName',
        headerName: 'Full name',
        flex: 1,
        valueGetter: (params) =>
            `${params.getValue('firstName') || ''} ${params.getValue('lastName') || ''}`,
    },
];

/*
const rows = [
    {id: 1, lastName: 'Cohen', firstName: 'Aron', payrate: 35},
    {id: 2, lastName: 'Mollica', firstName: 'Cole', payrate: 42},
    {id: 3, lastName: 'Huang', firstName: 'Anthony', payrate: 45},
    {id: 4, lastName: 'Nemec', firstName: 'John', payrate: 16},
    {id: 5, lastName: 'Chandra', firstName: 'Kevin', payrate: 69},
    {id: 6, lastName: 'Cohen', firstName: 'Seth', payrate: 150},
    {id: 7, lastName: 'Huang', firstName: 'Aron', payrate: 44},
    {id: 8, lastName: 'Chandra', firstName: 'John', payrate: 36},
    {id: 9, lastName: 'Nemec', firstName: 'Anthony', payrate: 65},
    {id: 10, lastName: 'Chandra', firstName: 'Cole', payrate: 150},
    {id: 11, lastName: 'Huang', firstName: 'Kevin', payrate: 44},
    {id: 12, lastName: 'Mollica', firstName: 'Anthony', payrate: 420},
    {id: 13, lastName: 'Chandra', firstName: 'Seth', payrate: 150},
    {id: 14, lastName: 'Huang', firstName: 'Seth', payrate: 44},
    {id: 15, lastName: 'Mollica', firstName: 'John', payrate: 36},
];
*/

const useStyles = makeStyles((theme) => ({
    grid: {
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(1)
    },
    paper: {
        height: '90%',
    },
    root: {
        '& .MuiButton-textPrimary': {
            color: theme.palette.text.primary,
        },
    },
    closeButton: {
        position: 'absolute',
        right: theme.spacing(1),
        top: theme.spacing(1),
    },
    container: {
        display: 'flex',
        flexWrap: 'wrap',
    },
    textField: {
        marginLeft: theme.spacing(1),
        marginRight: theme.spacing(1),
        width: 200,
    },

}));

function CustomGridFooter(props) {

    const classes = useStyles();

    const [openErrorDialog, setOpenErrorDialog] = React.useState(false);
    const [openEditEmployeeDialog, setOpenEditEmployeeDialog] = React.useState(false);
    const [openScheduleDialog, setOpenScheduleDialog] = React.useState(false);

    // Error Dialog Handler
    const handleErrorDialog = () => {
        if (openErrorDialog) {
            setOpenErrorDialog(false);
        } else {
            setOpenErrorDialog(true);
        }
    };

    // Scheduler Dialog Handler
    const handleScheduleDialog = () => {
        if (openScheduleDialog) {
            setOpenScheduleDialog(false);
        } else {
            setOpenScheduleDialog(true);
        }
    };

    // Scheduler Button Click Handler
    const handleAddSchedule = () => {
        if (props.selectionModel.selectionModel.length >= 1) {
            handleScheduleDialog();
        } else {
            handleErrorDialog();
        }
    }

    // Edit Employee Dialog Handler
    const handleEditEmployeeDialog = () => {
        if (openEditEmployeeDialog) {
            setOpenEditEmployeeDialog(false);
        } else {
            setOpenEditEmployeeDialog(true);
        }
    };

    // Edit Employee Button Click Handler
    const handleEditEmployee = () => {
        if (props.selectionModel.selectionModel.length === 1) {
            handleEditEmployeeDialog();
        } else {
            handleErrorDialog();
        }
    }

    // Fire Selected Button Click Handler
    const handleFireSelected = () => {
        console.log(props.selectionModel.selectionModel)
        // TODO Fire Selected: remove props.selectionModel.selectionModel ID's from database
        axios({
            method : "post",
            url:'http://localhost:3001/api/remove/user/multiple', 
            headers:{
                "Content-Type": "application/json",
                "Authorization" : "Bearer "+ getUserToken()
            },
            data : {
                "user_id" : props.selectionModel.selectionModel,
            }
        }).catch(error => {
            console.log("Error:", error);
        })
    }

    // Fire Random Button Click Handler
    const handleFireRandom = () => {
        // TODO Fire Random: pick a random id and delete from database
        axios({
            method : "post",
            url:'http://localhost:3001/api/schedule/add/multiple', 
            headers:{
                "Content-Type": "application/json",
                "Authorization" : "Bearer "+ getUserToken()
            },
            data : {
                "user_id" : props.state.state.rows[Math.floor(Math.random() * props.state.state.rows.length)].user_id
            }
        }).catch(error => {
            console.log("Error:", error);
        })
    }

    // ----------------------------------------------------------------------------------------------------------------
        // Edit Employee Form Handlers:

    const [editState, setEditState] = useState({
        payrate: ""
    })

    const handleEditInputChange = (event) => {
        setEditState((prevProps) => ({
            ...prevProps,
            [event.target.name]: event.target.value
        }));
    }

    const handleEdit = (value) => {
        value.preventDefault();

        axios({
            method : "post",
            url:'http://localhost:3001/api/edit/employee/multiple/pay', 
            headers:{
                "Content-Type": "application/json",
                "Authorization" : "Bearer "+ getUserToken()
            },
            data : {
                "user_id" : props.selectionModel.selectionModel,
                "pay_rate" : editState.payrate
            }
        }).catch(error => {
            console.log("Error:", error);
        })

    }

    // ----------------------------------------------------------------------------------------------------------------
        // Schedule Form Handlers:

    const [selectedStartDate, handleStartDateChange] = useState(new Date());
    const [selectedEndDate, handleEndDateChange] = useState(new Date());

    const [scheduleState, setScheduleState] = useState({
        title: ""
    })

    const handleScheduleInputChange = (event) => {
        setScheduleState((prevProps) => ({
            ...prevProps,
            [event.target.name]: event.target.value
        }));
    }

    const handleSchedule = (value) => {
        value.preventDefault();
        console.log("Title: " + scheduleState.title);
        console.log("Start Date: " + selectedStartDate.toISOString());
        console.log("End Date: " + selectedEndDate.toISOString());
        console.log(props.selectionModel.selectionModel[0]);

        axios({
            method : "post",
            url:'http://localhost:3001/api/schedule/add/multiple', 
            headers:{
                "Content-Type": "application/json",
                "Authorization" : "Bearer "+ getUserToken()
            },
            data : {
                "title" : scheduleState.title,
                "user_id" : props.selectionModel.selectionModel,
                "startDate" : selectedStartDate.toISOString(),
                "endDate" : selectedEndDate.toISOString()
            }
        }).catch(error => {
            console.log("Error:", error);
        })
    }

    // ----------------------------------------------------------------------------------------------------------------

    return (
        <Grid
            className={classes.grid}
            container
            direction="row"
            justify="space-between"
            alignItems="center">

            { /* Delete/Edit Button Group */}
            <Grid item>
                { /* Fire Selected Employee(s) */}
                <Tooltip title="Fire Selected Employee(s)">
                    <IconButton
                        onClick={handleFireSelected}
                    >
                        <DeleteForever/>
                    </IconButton>
                </Tooltip>
                { /* Edit Selected Employee */}
                <Tooltip title="Edit Employee">
                    <IconButton
                        onClick={handleEditEmployee}
                    >
                        <Edit/>
                    </IconButton>
                </Tooltip>
                { /* Edit Selected Employee Dialogs */}
                <Dialog
                    open={openErrorDialog}
                    onClose={handleErrorDialog}
                >
                    <DialogTitle>
                        Invalid Request.
                        {handleErrorDialog ? (
                            <IconButton
                                className={classes.closeButton}
                                onClick={handleErrorDialog}>
                                <CloseIcon/>
                            </IconButton>
                        ) : null
                        }
                    </DialogTitle>
                    <DialogContent dividers>
                        <Typography>
                            Please select an employee.
                        </Typography>
                    </DialogContent>
                </Dialog>
                <Dialog
                    fullWidth
                    open={openEditEmployeeDialog}
                    onClose={handleEditEmployeeDialog}
                >
                    <DialogTitle>
                        Update Employee Form:
                        {handleEditEmployeeDialog ? (
                            <IconButton
                                className={classes.closeButton}
                                onClick={handleEditEmployeeDialog}>
                                <CloseIcon/>
                            </IconButton>
                        ) : null
                        }
                    </DialogTitle>
                    <DialogContent dividers>
                        <form onSubmit={handleEdit} id="editForm">
                            <TextField
                                margin="normal"
                                id="payrate"
                                label="Payrate"
                                name="payrate"
                                color="secondary"
                                type="number"
                                fullWidth
                                value={editState.payrate}
                                onChange={handleEditInputChange}
                            />
                        </form>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={handleEditEmployeeDialog}
                            color="secondary"
                            type="submit"
                            form="editForm"
                        >
                            Send
                        </Button>
                    </DialogActions>
                </Dialog>
                { /* Add Schedule To Employee(s) */}
                <Tooltip title="Add Schedule">
                    <IconButton
                        onClick={handleAddSchedule}
                    >
                        <Event/>
                    </IconButton>
                </Tooltip>
                { /* Add Schedule Dialog */}
                <Dialog
                    fullWidth
                    open={openScheduleDialog}
                    onClose={handleScheduleDialog}
                >
                    <DialogTitle>
                        Add To Schedule:
                        {handleScheduleDialog ? (
                            <IconButton
                                className={classes.closeButton}
                                onClick={handleScheduleDialog}>
                                <CloseIcon/>
                            </IconButton>
                        ) : null
                        }
                    </DialogTitle>
                    <DialogContent dividers>
                        <form onSubmit={handleSchedule} id="scheduleForm">
                            <TextField
                                margin="normal"
                                id="title"
                                label="Title"
                                name="title"
                                color="secondary"
                                fullWidth
                                value={scheduleState.title}
                                onChange={handleScheduleInputChange}
                            />
                            <Grid container spacing="1">
                                <Grid item>
                                    <MuiPickersUtilsProvider utils={MomentUtils}>
                                        <DateTimePicker
                                            id="startdate"
                                            label="Start Date"
                                            name="startdate"
                                            value={selectedStartDate}
                                            onChange={handleStartDateChange}/>
                                    </MuiPickersUtilsProvider>
                                </Grid>
                                <Grid item>
                                    <MuiPickersUtilsProvider utils={MomentUtils}>
                                        <DateTimePicker
                                            id="enddate"
                                            label="End Date"
                                            name="enddate"
                                            value={selectedEndDate}
                                            onChange={handleEndDateChange}/>
                                    </MuiPickersUtilsProvider>
                                </Grid>
                            </Grid>
                        </form>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={handleScheduleDialog}
                            color="secondary"
                            type="submit"
                            form="scheduleForm"
                        >
                            Add
                        </Button>
                    </DialogActions>
                </Dialog>
            </Grid>

            { /* Table Paginator */}
            <GridFooter/>

            { /* Fire Random Employee */}
            <Tooltip title="Fire Random Employee">
                <IconButton
                    onClick={handleFireRandom}
                >
                    <DeleteSweep/>
                </IconButton>
            </Tooltip>

        </Grid>
    );
}

export default function Employees() {
    const classes = useStyles();


    const [selectionModel, setSelectionModel] = React.useState([])

    let token = getUserToken();
    
    const [state, setState] = useState({
        "rows" : []
    });


    useEffect(() => {

        async function getData(){
            if (token == null){
                
            }else{

                await axios({
                    method : "get",
                    url : "http://localhost:3001/api/company/users",
                    headers : {
                        "Content-Type": "application/json",
                        "Authorization" : "Bearer "+token
                }}).then((response) => {
                    setState({"rows" :response.data});
                    return response.data[0];
                }).catch(error => {
                    console.log(error);
                });
            }         
    }
    getData();
    },[token]);

    return (
        <Paper className={classes.paper}>
            <DataGrid
                className={classes.root}
                rows={state.rows}
                columns={columns}
                pageSize={15}
                checkboxSelection
                onSelectionModelChange={(newSelection) => {
                    setSelectionModel(newSelection.selectionModel);
                }}
                selectionModel={selectionModel}
                components={{
                    Toolbar: GridToolbar,
                    Footer: CustomGridFooter,
                }}
                componentsProps={{footer: {selectionModel: {selectionModel}, state: {state}}}}
            />

        </Paper>
    );
}