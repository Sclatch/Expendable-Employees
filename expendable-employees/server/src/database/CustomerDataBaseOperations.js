let DatabaseManagment = require('./Interaction.js');
let evalidator = require("email-validator");
let jsonValidator = require('./SchemaEnforcment');
var ObjectID = require('mongodb').ObjectID;

const bcrypt = require('bcrypt');
const saltRounds = 10;


function validateUser(data) {

    if (data["email"] == undefined) {
        return false;
    }
    if (!evalidator.validate(data["email"].replace(/ /g, ""))) {
        return false;
    }

    return true;
};


class CustomerDataBaseOperations {

    constructor() {
        this.db_instance = new DatabaseManagment();
    }


    async hashPassword(password) {
        let salt = await bcrypt.genSalt(saltRounds);
        let hash = await bcrypt.hash(password, salt);
        return hash;

    }

    async compareHashedPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

 
    async getHashedPassword(email){
        let query = {
            "email" : email
        }
        let user = await this.db_instance.queryCollection(query, "User");
        if(user.length < 1){
            return {"success": false,
                    "reason": "account not found",
                    "code" : 404}
        }
        return {success : true, "user" : user[0]}; 
    }

    // fixed bad queries
    async registerCompany(data) {
        if(data.user == undefined){
            return {"success" : false,
                    "reason" : "user entry is left blank"}
        }
        if(data.company == undefined) {
            return {"success" : false,
            "reason" : "company entry left blank"}
        }

        if(data.branch == undefined) {
            return {"success" : false,
            "reason" : "branch entry left blank"}
        }

        let success = await this.registerUser(data.user);
        
        if (!success.success) {
            return success;
        }
        let query = {
            "email": data.user.email
        };

        let user = await this.db_instance.queryCollection(query, "User");

        data.company["owner"] = user[0]._id.toString() 

        

        success = await this.insertCompany(data.company);
        if (!success.success) {

            await this.db_instance.dropDocument(data.user, "User");
            // delete created user entry
            return success;
        }


        let company = await this.db_instance.queryCollection(data.company, "Company");
        data.branch["company_id"] = company[0]._id.toString()
        
        success = await this.registerBranch(data.branch);

        if (!success.success) {
            // delete created user and company entry 
            await this.db_instance.dropDocument(data.user, "User");
            await this.db_instance.dropDocument(data.company, "Company");
            return success;
        }

        let admin = {
            "user" : user[0]._id.toString(),
            "company" : company[0]._id.toString()
        }

        success = await this.registerAdmin(admin);
        console.log(success);


        if (!success.success) {
            // delete created user and company entry 
            await this.db_instance.dropDocument(data.user, "User");
            await this.db_instance.dropDocument(data.company, "Company");
            await this.db_instance.dropDocument(data.branch, "Branch");
            return success;

        }
        success = await this.db_instance.insertToCollection({
            Position : "Owner",
            company_id : company[0]._id.toString(),
            user_id: user[0]._id.toString(),
            pay_rate: 0
        }, "Employee");


        return success;



    }

    /*
        expects query = {
            "admin_id" : "User._id'
            "user_id" : "User_id"
        }
    */
    async isAdminOverUser(query) {
        
        let employee_query = await this.db_instance.queryCollection({"user_id" : query.user_id}, "Employee");

        if(employee_query.length < 1){
            return false;
        }

        let admin_query = await this.db_instance.queryCollection({"user" : query.admin_id, "company" : employee_query[0].company_id}, "Adminstrators");
        if(admin_query.length < 1){
            return false;
        }

        return true;


    }
    async isAdminForCompany(query) {
        
        var validation = jsonValidator(query,"Adminstrators");
        if(!validation.valid){
            return false;
        }

        let admin_query = await this.db_instance.queryCollection(query, "Adminstrators");
        
        if(admin_query.length > 0){
            return true
        }
        return false;
    }

    async registerAdmin(data){
        var validation = jsonValidator(data,"Adminstrators");
        if(!validation.valid){
            return{
                "success": false,
                "reason" : validation.errors
            }
        }
        try {
            var company_query = await this.db_instance.queryCollection({"owner" : new ObjectID(data.company)}, "Company");

            // making sure the owner company exists
            var user_query = await this.db_instance.queryCollection({"_id" : new ObjectID(data.user)}, "User");

        }catch(err){
            return {
                "success": false,
                "reason": "either use or company id is invalid"
            } 
        }
        
        // making sure there is not already a branch with these parameters
        if (company_query.length > 0) {
            return {
                "success": false,
                "reason": "there is already a company with that name to that owner"
            };
        } else if (user_query.length < 1) {
            return {
                "success": false,
                "reason": "the owner of that branch doesnt exist"
            };

        }

        let result = await this.db_instance.insertToCollection(data, "Adminstrators");
        if (result) {
            return {
                "success": true
            }
        } else {
            return {
                "success": false,
                "reason": "was unable to insert into company collection"
            }
        }
        
    }

    // expects data to be what is defined in the company schema - id
    async insertCompany(data) {
        var validation = jsonValidator(data,"Company");
        if(!validation.valid){
            return{
                "success": false,
                "reason" : validation.errors
            }
        }
        let company_query = await this.db_instance.queryCollection({"owner" : new ObjectID(data.owner)}, "Company");

        // making sure the owner company exists
        let user_query = await this.db_instance.queryCollection({"_id" : new ObjectID(data.owner)}, "User");


        // making sure there is not already a branch with these parameters
        if (company_query.length > 0) {
            return {
                "success": false,
                "reason": "there is already a company with that name to that owner"
            };
        } else if (user_query.length < 1) {
            return {
                "success": false,
                "reason": "the owner of that branch doesnt exist"
            };
        } else {
            let result = await this.db_instance.insertToCollection(data, "Company");
            if (result) {
                return {
                    "success": true
                }
            } else {
                return {
                    "success": false,
                    "reason": "was unable to insert into company collection"
                }
            }
        }
    }
    // expects data to be what is defined in the Branch schema - id
    // this function is onyl to be used in registration.
    async registerBranch(data) {
        var validation = jsonValidator(data,"Branch");
        if(!validation.valid){
            return{
                "success": false,
                "reason" : validation.errors
            }
        }

        // making sure the owner company exists
        //let user_query = await this.db_instance.queryCollection({"_id" : new ObjectID(data.user_id)}, "User");

    
        let result = await this.db_instance.insertToCollection(data, "Branch");
        if (result) {
            return {
                "success": true
            }
        } else {
            return {
                "success": false,
                "reason": "was unable to insert into branch collection "
            }
        }
    
    }


    // checkes the database to see if the specified email is taken
    async isEmailNotTaken(query) {
        let data = await this.db_instance.queryCollection({"email":query}, "User");

        if (data.length > 0) {
            return false;
        } else {
            return true
        }
    
    }

    // expects data to be what is defined in the User schema -id
    async registerUser(data) {
        var validation = jsonValidator(data,"User");
        if(!validation.valid){
            return{
                "success": false,
                "reason" : validation.errors
            }
        }

        let isNotTaken = await this.isEmailNotTaken(data.email);

        if (isNotTaken && validateUser(data)) {
                        
            data.password = await this.hashPassword(data.password);
            await this.db_instance.insertToCollection(data, "User");
            return  {"success" : true}
            
        } else {
            return {
                "success": false,
                "reason": "email is taken or invalid"
            };
        }

    }

    async registerEmployee(data){
        await this.registerUser({
            firstname : data.firstname,
            lastname : data.lastname,
            email: data.email,
            phone: data.phone,
            address: data.address,
            postal_code: data.postal_code,
            date_of_birth: data.date_of_birth,
            password: data.password
        })
        let new_user = await this.db_instance.queryCollection({"email" : data.email}, "User");

        return this.db_instance.insertToCollection({
            "user_id" : new_user[0]._id.toString(),
            "Position" : data.Position,
            "company_id" : data.company_id,
            "pay_rate" : data.pay_rate
        }, "Employee").then(function(result) {
            return {
                "success": result
            };
        });
            
       
    }

    async readEmailMultiple(data) {
        for (let i = 0; i < data.mail_id.length; i++ ){
            let query_result = await this.db_instance.queryCollection({"_id" : new ObjectID(data.mail_id[i].mail_id)}, "Email");

            console.log(query_result);
            console.log(query_result[0]);
            for (let i = 0 ; i <  query_result[0].receivers.length;i++){
                console.log(query_result[0].receivers[i].user_id);
                console.log(query_result[0].receivers[i].user_id == data.user_id);
                if (query_result[0].receivers[i].user_id == data.user_id ){
                    query_result[0].receivers[i]["is-read"] = true;
                }
            }
            
            await this.db_instance.updateDocument({"_id" : new ObjectID(data.mail_id[i].mail_id)}, query_result[0], "Email");
        }
    }

    async sendEmail(message){
    
        var validation = jsonValidator(message,"Email");
        if(!validation.valid){
            return {
                "success" : false,
                "code" : 400
            };
        }
        
        message["time_sent"] = new Date(Date.now()).toISOString();
                
        let re_format = []; 
        for(var i = 0; i < message.receivers.length; i++){
            let status_dict = { "user_id" : message.receivers[i],
                                "is-read" : false};

            re_format.push(status_dict);
        }
        
        message.receivers = re_format;
        let result = await this.db_instance.insertToCollection(message, "Email");
        
        if(!result){
            return {
                "success" : false,
                "code" : 500
            };
        }

        return {
            "success" : true,
        };
    }

    async sentEmails(query){
        let company_query = await this.db_instance.queryCollection({"sender" : query.user_id}, "Email");
        return company_query;
    }

    async receiveEmails(query){
        let company_query = await this.db_instance.queryCollection({"receivers" : {$elemMatch: {"user_id" : query}}}, "Email");
        return company_query;
    }

    async queryUser(query){
        let user_query = await this.db_instance.queryCollection(query, "User");
        return user_query;
    }

    async getUserSchedule(query){
        let schedule_query = await this.db_instance.queryCollection({"user_id": query}, "Schedule");
        return schedule_query;
    }

    async addUserSchedule(data){
        var validation = jsonValidator(data,"Schedule");
        if (!validation){
            return {
                "success" : false,
                "code" : 400
            };
        }
        let result = await this.db_instance.insertToCollection(data, "Schedule");

        if (result) {
            return {
                "success": true
            }
        } else {
            return {
                "success": false,
                "reason": "was unable to insert into company collection"
            }
        }
    }

    /*
        expects query = {
            "user_id" : User._id
        }
    */

    async getUsersCompany(query){
        let user_query = await this.db_instance.queryCollection(query, "Employee");
        if(user_query.length < 1){
            return false;
        }

        
        
        return user_query[0].company_id;
    }

    /*
    // expects query = {
        company_id = Company._id
    } 
    */
    async getCompanyUsers(query){
        let employee_query = await this.db_instance.queryCollection(query, "Employee");
        if(employee_query.length < 1){
            return false;
        }

        let user_ids = []
        for(var i = 0; i < employee_query.length; i++){
            user_ids.push( new ObjectID(employee_query[i].user_id));
        }

        let user_query = {
            "_id" : {
                "$in" : user_ids
            }
        }

        let users = await this.db_instance.queryCollection(user_query,"User");
        let redacted_usrs = [];

        for(var i = 0; i < users.length; i++){
            redacted_usrs.push({
                "id" : users[i]._id.toString(), 
                "firstName" : users[i].firstname,
                "lastName" :  users[i].lastname,
            });
        }


        return redacted_usrs;
    }

    /*
        expects query to have 
        query = {
            user_id = User._id
        }
    */

    async getUser(query){
        if(query.user_id == null){
            return 401;
        }
    
        try{
            var user_query = await this.db_instance.queryCollection({"_id": new ObjectID(query.user_id)}, "User");
        }catch(err){
            return 500;
        }
        
        if(user_query < 1){
            return 400;
        }

        return user_query

    }

    /*
        expects 
        data = {
                "user_id" : "Employee._id",
                "password" : "newpassword"
        }
    */
    async resetPassword(data){
        if(data.password == undefined | data.user_id == null){
            return false;
        }

        try{
            var user_query = await this.db_instance.queryCollection({"_id": new ObjectID(data.user_id)}, "User");

        }catch(err){
            return {   
                "success": false,
                "reason": "id provided is invalid format"
            };
        }
        
        if(user_query < 1){
            return {   
                "success": false,
                "reason": "user being updated does not exist"
            };
        }


        let hashed_password = await this.hashPassword(data.password);
        let query = {
            "_id" : new ObjectID(data.user_id),
        }

        let success = this.db_instance.updateDocument(query,{"password" : hashed_password},"User");
        if(success){
            return {
                "success": true
            };
        }
        return {
            "success": success,
            "reason": "was unable to update the document"
        };
    }

    async removeUser(data){
        try{
            var result = await this.db_instance.dropDocument({"_id": new ObjectID(data.user_id)}, "User");

        }catch(err){
            return {   
                "success": false,
                "reason": "id provided is invalid format"
            };
        }

        if(!result){
            return {   
                "success": false,
                "reason": "user being updated does not exist"
            };
        }
        else {
            return {
                "success": true
            }
        }
    }
    // expects the user_id
    async getAdmin(data){
        let success = await this.db_instance.queryCollection(data,"Adminstrators");
        return success;
    }

    async removeEmployee(data){
        try{
            var result = await this.db_instance.dropDocument({"_id": new ObjectID(data.user_id)}, "User");

        }catch(err){
            return {   
                "success": false,
                "reason": "id provided is invalid format"
            };
        }

        if(!result){
            return {   
                "success": false,
                "reason": "user being updated does not exist"
            };
        }
        else {
            return {
                "success": true
            }
        }
    }

    async editEmployeePay(data){
        try{
            var user_query = await this.db_instance.queryCollection({"_id" : new ObjectID(data.user_id)}, "User")

            let temp = user_query[0];

            temp.pay_rate = data.pay_rate;

            var result = await this.db_instance.updateDocument({"_id": new ObjectID(data.user_id)}, temp, "User");
        }catch(err){
            return {   
                "success": false,
                "reason": "id provided is invalid format"
            };
        }

        if(!result){
            return {   
                "success": false,
                "reason": "user being updated does not exist"
            };
        }
        else {
            return {
                "success": true
            }
        }
    }

    /*
     payload = {
        "firstname" : "firstname",
        "lastname" : "lastname",
        "date_of_birth" : "Date",
        "phone" : "phone numb",
        "address" : address,
        "user_id" : User._id

    }
    

    */
    async updateUser(data){

        try{
            var user_query = await this.db_instance.queryCollection({"_id": new ObjectID(data.user_id)}, "User");

        }catch(err){
            return {   
                "success": false,
                "reason": "id provided is invalid format"
            };
        }
        
        if(user_query < 1){
            return {   
                "success": false,
                "reason": "user being updated does not exist"
            };
        }

        let query = {
            "_id" : new ObjectID(data.user_id),
        }
        delete data["user_id"];
        let success = this.db_instance.updateDocument(query,data,"User");
        if(success){
            return {
                "success": true
            };
        }
        return {
            "success": success,
            "reason": "was unable to update the document"
        };

    }
}

module.exports = CustomerDataBaseOperations;