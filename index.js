
const {GraphQLServer, PubSub} = require("graphql-yoga")
const {events, users,participants,locations} = require('./data');

const typeDefs = `
    type Event {
        id: ID
        title: String
        desc: String
        date: String
        from: String
        to: String
        location: Location
        user: User
        participants: [Participant]
    }
    type Location {
        id: ID
        name: String
        desc: String
        lat: Float
        lng: Float
    }

    type User {
        id: ID
        username: String
        email: String
        events : [Event]
        participant: Participant
    }

    type Participant {
        id: ID
        user: User
        event: Event 
    }
    input CreateUserInput{
        username: String
        email: String
        events: String
    }
    input updateUser {
        username: String
        email: String
    }
    input createEventInput {
        id: ID
        title: String
        desc: String
        date: String
        from: String
        to: String
        
    }
    input updateEvent {
        title: String
        desc: String
        date: String
        from: String
        to: String
    }
    input createLocationInput {
        id: ID
        name: String
        desc: String
        lat: Float
        lng: Float
    }
    input updateLocation {
        name: String
        desc: String
        lat: Float
        lng: Float
    }
    input createParticipantInput {
        id: ID  
    }
    type deleteAllOutput {
        count: Int
    }
    type Mutation {
        #User
        createUser(data: CreateUserInput): User
        createEvent(data: createEventInput): Event
        createLocation(data: createLocationInput): Location
        createParticipant(data: createParticipantInput): Participant
        updateUser(id: ID, data: updateUser): User
        updateEvent(id: ID, data: updateEvent): Event
        updateLocation(id: ID, data: updateLocation): Location
        deleteUser(id: ID): User
        deleteEvent(id: ID): Event
        deleteLocation(id: ID): User
        deleteAllUser: deleteAllOutput
        deleteAllEvent: deleteAllOutput
        deleteAllLocation: deleteAllOutput

    }

    type Query {
        events: [Event]
        event(id: ID): Event

        users: [User]
        user(id: ID): User

        locations: [Location]
        location(id: ID): Location!

        participants: [Participant]    
        participant(id: ID): Participant
    }

    type Subscription {
        userCreated: User
        eventCreated: Event
        participantCreated: Participant
    }
`
const resolvers = {
    Subscription : {
        userCreated: {
            subscribe: (parent, args , {pubsub}) => {
                
                return pubsub.asyncIterator("userCreated")
            }
        },
        eventCreated: {
            subscribe: (parent, args , {pubsub}) => {
                
                return pubsub.asyncIterator("eventCreated")
            }
        },
        participantCreated: {
            subscribe: (parent, args , {pubsub}) => {
                
                return pubsub.asyncIterator("participantCreated")
            }
        }  
    },
    Query: {
        events: () => events,
        event: (parent, args) => events.find(event => event.id == args.id),
        
        locations: () => locations,
        location: (parent,args) => locations.find(location => location.id == args.id),

        users: () => users,
        user: (parent ,args) => users.find(user => user.id == args.id),

        participants: () => participants,
        participant: (parent,args) => participants.find(participant => participant.id == args.id)

    },
    Mutation: {
        createUser: (parent, { data }, {pubsub}) => {
            
            const newUser = {...data, id: Math.random()}
            users.push(newUser)
            pubsub.publish("userCreated", {userCreated: newUser})
            return newUser
        },
        createEvent: (parent, {data}, {pubsub}) => {
            const newEvent = {...data, id: Math.random()}
            events.push(newEvent)
            pubsub.publish("eventCreated", {eventCreated: newEvent})
            return newEvent
        },
        createLocation: (parent, {data}) => {
            const newLocation = {...data, id: Math.random()}
            locations.push(newLocation)
            return newLocation
        },
        createParticipant: (parent, {data}, {pubsub}) => {
            const newParticipant = {...data, id: Math.random()}
            participants.push(newParticipant)
            pubsub.publish("participantCreated", {participantCreated: newParticipant})
            return newParticipant
        },
        updateUser: (parent, {data, id}) => {
            const index = users.findIndex(user => user.id == id)
            users[index] = {...users[index], ...data}
            return users[index]
            
        },
        updateEvent: (parent, {data, id}) => {
            const index = events.findIndex(event => event.id == id)
            events[index] = {...events[index], ...data}
            return events[index]
            
        },
        updateLocation: (parent, {data, id}) => {
            const index = locations.findIndex(location => location.id == id)
            locations[index] = {...locations[index], ...data}
            return locations[index]
            
        },
        deleteUser: (parent, {id}) => {
            const index = users.findIndex(user => user.id == id)
            users.splice(index, 1)
            return users[index]
        },
        deleteEvent: (parent, {id}) => {
            const index = events.findIndex(event => event.id == id)
            events.splice(index, 1)
            return events[index]
        },
        deleteLocation: (parent, {id}) => {
            const index = locations.findIndex(location => location.id == id)
            locations.splice(index, 1)
            return locations[index]
        },
        deleteAllUser: () => {
            const length = users.length
            users.splice(0,length)
            return {
                count: length
            }
        },
        deleteAllEvent: () => {
            const length = events.length
            events.splice(0,length)
            return {
                count: length
            }
        },
        deleteAllLocation: () => {
            const length = locations.length
            locations.splice(0,length)
            return {
                count: length
            }
        }

    },
    User: {
        events: (parent) => events.filter(event => event.user_id == parent.id),
        participant: (parent) => participants.find(p => p.user_id == parent.id),
        
    },
    Event: {
        location: (parent) => locations.find(location => location.id == parent.location_id),
        participants: (parent) => participants.filter(p => p.event_id == parent.id),
        user: (parent) => users.find(user => user.id == parent.user_id)
    },
    Participant: {
        user: (parent) => users.find(user => user.id == parent.user_id),
        event: (parent) => events.find(event => event.id == parent.event_id)
    }
   
}


const pubsub = new PubSub()
const server = new GraphQLServer({
    typeDefs, 
    resolvers, 
    context: {pubsub}
})
server.start(() => console.log("Server is running on 4000!"))

