# XIV Resource Registry
The **XIV Resource Registry** is a community-driven initiative designed to store and manage metadata for 
Final Fantasy XIV (FFXIV)-related software projects. This registry encompasses a wide range of projects, 
including plugins, overlays, websites, Discord servers, and more. By adhering to a standard specification, 
contributors can ensure their projects are easily discoverable and accessible. You can view and search the 
current repository on the [XIV Resource Registry website](https://github.com/kalilistic/xiv-resource-registry).

## Use Cases
- **Automated Aggregation**: Tool developers can pull metadata from the registry to create automated lists, dashboards, or directories of community resources.
- **Enhanced Discoverability**: Websites and platforms can integrate with the registry to surface new tools, plugins, or services, making them easily accessible to the FFXIV community.
- **Centralized Metadata Management**: Project maintainers can manage their metadata centrally within the registry, maintaining consistency across the community.
- **Collaboration and Contribution**: Community members can easily contribute to the registry, helping to keep the list of resources up-to-date and comprehensive.

## How it works
- The registry comprises yaml files representing the metadata for each resource and author.
- Each resource file contains information about the project, including its name, description, author, and links to the project's repository, website, and other relevant URLs.
- The yaml files are validated against a standardized JSON schema to ensure consistency and accuracy.
- The yaml and json are published as releases in the repository, allowing developers to access the metadata programmatically.
- The ci scripts will generate the author file for resources if it doesn't already exist.

## Project Structure
- `authors/` - Contains the metadata files for each author.
- `resources/` - Contains the metadata files for each project.
- `schemas/` - Contains the JSON schema for the metadata files.
- `scripts/` - Contains scripts for validating the metadata files.

## How to Contribute
1. Fork the XIV Resource Registry repository.
2. Create a new YAML file for your project in the `resources` directory. Follow the schema defined in the repository for consistent metadata formatting.
3. Submit a pull request with your changes.

_Note: If you are not comfortable with this process, you can submit your resource or updates through GitHub Issues._

## Roadmap
* [x] Build initial release with schema validation  
* [x] Create basic webpage to browse metadata  
* [ ] Provide packages for popular programming languages to access the registry programmatically