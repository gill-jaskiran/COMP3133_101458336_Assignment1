// Imports
const { 
    GraphQLObjectType, GraphQLSchema, GraphQLString, GraphQLFloat, 
    GraphQLList, GraphQLNonNull 
} = require('graphql');
const bcrypt = require('bcryptjs'); // for password hashinng
// importing mongoose models
const User = require('../models/User');
const Employee = require('../models/Employee');

// defining Graphql type for user
const UserType = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
        id: { type: GraphQLString },
        username: { type: GraphQLString },
        email: { type: GraphQLString },
        created_at: { type: GraphQLString },
        updated_at: { type: GraphQLString },
    }),
});


// defining Graphql type for employee
const EmployeeType = new GraphQLObjectType({
    name: 'Employee',
    fields: () => ({
        id: { type: GraphQLString },
        first_name: { type: GraphQLString },
        last_name: { type: GraphQLString },
        email: { type: GraphQLString },
        gender: { type: GraphQLString },
        designation: { type: GraphQLString },
        salary: { type: GraphQLFloat },
        date_of_joining: { type: GraphQLString },
        department: { type: GraphQLString },
        created_at: { type: GraphQLString },
        updated_at: { type: GraphQLString },
    }),
});

// setting the mutations for the graphql
const Mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        // mutation for sign up process
        signup: {
            type: UserType,
            args: { // setting all arguments needed for the sign up
                username: { type: GraphQLString },
                email: { type: GraphQLString },
                password: { type: GraphQLString },
            },
            resolve: async (parent, { username, email, password }) => { 
                // hashing the password before it gets store in the database
                // and creating a new user with set hashed password
                const hashedPassword = await bcrypt.hash(password, 10);
                const newUser = new User({ username, email, password: hashedPassword });
                return await newUser.save(); // saving into stabase
            },
        },
        //mutation for login
        login: {
            type: UserType,
            args: { // args needed to login
                username: { type: GraphQLString },
                password: { type: GraphQLString },
            },
            resolve: async (parent, { username, password }) => {
                const user = await User.findOne({ username }); // finding by username
                // comparing the user input with the stored password
                if (!user) throw new Error('User not found');
                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) throw new Error('Sorry, Invalid login credentials');
                return user; // return detail for sucessful login
            },
        },
        // mutation for adding employee
        addEmployee: {
            type: EmployeeType,
            args: { // args needed for adding employee
                first_name: { type: GraphQLString },
                last_name: { type: GraphQLString },
                email: { type: GraphQLString },
                gender: { type: GraphQLString },
                designation: { type: GraphQLString },
                salary: { type: GraphQLFloat },
                date_of_joining: { type: GraphQLString },
                department: { type: GraphQLString },
            },
            resolve: async (parent, args) => {
                const newEmployee = new Employee(args); // creating a new employee with set args
                return await newEmployee.save(); // saving in database
            },
        },
        // mutation for updating employee
        updateEmployeeByEid: {
            type: EmployeeType,
            args: { // args required for updating
                employee_id: { type: new GraphQLNonNull(GraphQLString) },
                first_name: { type: GraphQLString },
                last_name: { type: GraphQLString },
                email: { type: GraphQLString },
                gender: { type: GraphQLString },
                designation: { type: GraphQLString },
                salary: { type: GraphQLFloat },
                date_of_joining: { type: GraphQLString },
                department: { type: GraphQLString },
            },
            resolve: async (parent, { employee_id, ...updateFields }) => {
                // finding employee and updating using the employee ID
                const updatedEmployee = await Employee.findByIdAndUpdate(employee_id, updateFields, { new: true });
                return updatedEmployee;// returning updated informaation 
            },
        },
        // mutation for deleting employee
        deleteEmployee: {
            type: EmployeeType,
            args: { // args needed to delete employee by id
                employee_id: { type: new GraphQLNonNull(GraphQLString) },
            },
            resolve: async (parent, { employee_id }) => {
                // finding employee by id 
                // deleting employee by id
                const deletedEmployee = await Employee.findByIdAndDelete(employee_id);
                return deletedEmployee;
            },
        },
    },
});

// fetching data
const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        // getting the employee data by id
        getAllEmployees: {
            type: new GraphQLList(EmployeeType), // return list of employee
            resolve: async () => { // getting all employee from database
                return await Employee.find();
            },
        },
        // searching by id
        searchEmployeeByEid: {
            type: EmployeeType,
            args: { // args needed to search for employee
                // need to attain employee id
                employee_id: { type: new GraphQLNonNull(GraphQLString) },
            },
            resolve: async (parent, { employee_id }) => {
                return await Employee.findById(employee_id); // finding by id
            },
        },
        // search by fesignation or department
        searchEmployeeByDesignationOrDepartment: {
            type: new GraphQLList(EmployeeType), // returning employee list
            args: { // args needed for searching
                designation: { type: GraphQLString },
                department: { type: GraphQLString },
            },
            resolve: async (parent, { designation, department }) => {
                const query = {}; // creating empty object
                if (designation) query.designation = designation; // filter by designation
                if (department) query.department = department; // filter by department
                return await Employee.find(query); // get data matching the query
            },
        },
    },
});

// setting root query and mutation
const schema = new GraphQLSchema({
    query: RootQuery, 
    mutation: Mutation,
});

module.exports = schema;
