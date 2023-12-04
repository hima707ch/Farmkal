class ApiFeatures{
    constructor(query, queryStr){
        this.query = query;              // Task.find
        this.queryStr = queryStr;        // req.query
    }

    filter(){
        const query = {...this.queryStr};

        const removeFields = ["sort", "page", "limit"];

        removeFields.forEach((ele)=>{
            delete query[ele];
        })

        this.query = this.query.find(query);

        return this;
    }

    sort(){
        if(this.queryStr.sort){
                const sortBy = this.queryStr.sort.replaceAll(',',' ');
                this.query = this.query.sort(sortBy);
            }
            return this;
    }

    paginate(){
        if(this.queryStr.limit && this.queryStr.page){
            const page = this.queryStr.page*1 || 1;
            const limit = this.queryStr.limit*1 || 10;
            const skip = (page -1)*limit;

            this.query = this.query.skip(skip).limit(limit);

        }
        return this;
    }
}

module.exports = ApiFeatures;